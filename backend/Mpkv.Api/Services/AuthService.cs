using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.Auth;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Mpkv.Api.Services
{
    public interface IAuthService
    {
        LoginResponse Login(LoginRequest request, string ipAddress);
        UserInfo?     GetMe(ClaimsPrincipal principal);
    }

    /// <summary>
    /// Unified auth service — handles ALL user types with one login.
    /// Mirrors Login.aspx.cs ProcessLoginActivity() from the old project.
    /// UserTypeID 91 = Candidate → /candidate/dashboard
    /// UserTypeID 61 = College   → /college/dashboard
    /// UserTypeID 11/12 = Admin  → /admin/dashboard
    /// </summary>
    public class AuthService : IAuthService
    {
        private readonly DbAccess      _db;
        private readonly IConfiguration _config;

        public AuthService(DbAccess db, IConfiguration config)
        {
            _db     = db;
            _config = config;
        }

        public LoginResponse Login(LoginRequest request, string ipAddress)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.UserLoginID) ||
                    string.IsNullOrWhiteSpace(request.UserPassword))
                    return new LoginResponse { Success = false, Message = "Login ID and password are required." };

                // Base64-encode password — same as CommonHelper.Base64Encrypt() in old project
                var encodedPwd = PasswordHelper.Encode(request.UserPassword);

                var param = new DynamicParameters();
                param.Add("@UserLoginID",    request.UserLoginID.Trim());
                param.Add("@UserPassword",   encodedPwd);
                param.Add("@BrowserName",    "React");
                param.Add("@BrowserVersion", "1.0");
                param.Add("@IPAddress",      ipAddress);

                var dt = _db.GetDataTable("Account_CheckUserExists", param);

                if (dt == null || dt.Rows.Count == 0)
                    return new LoginResponse { Success = false, Message = "Invalid Login ID or Password." };

                var row = dt.Rows[0];

                bool isAllowed = Convert.ToBoolean(row["IsLoginAllowed"]);
                if (!isAllowed)
                    return new LoginResponse
                    {
                        Success = false,
                        Message = row["ErrorMessage"]?.ToString() ?? "Login not allowed."
                    };

                int  userTypeId = Convert.ToInt32(row["UserTypeID"]);
                long userId     = Convert.ToInt64(row["UserID"]);
                long sessionId  = Convert.ToInt64(row["LoggedInSessionID"]);

                // DashBoardPath from DB maps to old ASP.NET path like ~/Dashboard/DashboardCandidate.aspx
                // We override it with the React route based on UserTypeID
                string dashboardPath = UserTypeHelper.GetDashboardRoute(userTypeId);

                var user = new UserInfo
                {
                    UserID        = userId,
                    UserLoginID   = row["UserLoginID"]?.ToString()  ?? request.UserLoginID,
                    UserName      = row["UserName"]?.ToString()     ?? string.Empty,
                    UserTypeID    = userTypeId,
                    DashBoardPath = dashboardPath,
                    PhotoPath     = row["PhotoPath"]?.ToString()    ?? string.Empty,
                    CourseID      = row["CourseID"]   != DBNull.Value ? Convert.ToInt32(row["CourseID"])   : 0,
                    DistrictID    = row["DistrictID"] != DBNull.Value ? Convert.ToInt32(row["DistrictID"]) : 0,
                    IsAdmin       = UserTypeHelper.IsAdmin(userTypeId)
                };

                // Record successful login in DB — same as old AccountWorker.UpdateLoginStatus()
                var sessParam = new DynamicParameters();
                sessParam.Add("@UserID",            userId);
                sessParam.Add("@LoggedInSessionID", sessionId);
                try { _db.ExecuteNonQuery("Account_UpdateLoginStatus", sessParam); } catch { }

                string token = GenerateToken(user, sessionId);

                return new LoginResponse { Success = true, Message = "Login successful.", Token = token, User = user };
            }
            catch (Exception ex)
            {
                return new LoginResponse { Success = false, Message = $"Login error: {ex.Message}" };
            }
        }

        public UserInfo? GetMe(ClaimsPrincipal principal)
        {
            if (principal.Identity?.IsAuthenticated != true) return null;
            return new UserInfo
            {
                UserID        = long.Parse(principal.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? "0"),
                UserLoginID   = principal.FindFirstValue(JwtRegisteredClaimNames.UniqueName) ?? string.Empty,
                UserName      = principal.FindFirstValue(ClaimTypes.Name) ?? string.Empty,
                UserTypeID    = int.Parse(principal.FindFirstValue("UserTypeID") ?? "0"),
                CourseID      = int.Parse(principal.FindFirstValue("CourseID")   ?? "0"),
                DistrictID    = int.Parse(principal.FindFirstValue("DistrictID") ?? "0"),
                DashBoardPath = UserTypeHelper.GetDashboardRoute(int.Parse(principal.FindFirstValue("UserTypeID") ?? "0")),
                IsAdmin       = UserTypeHelper.IsAdmin(int.Parse(principal.FindFirstValue("UserTypeID") ?? "0"))
            };
        }

        private string GenerateToken(UserInfo user, long sessionId)
        {
            var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiry = DateTime.UtcNow.AddHours(Convert.ToInt32(_config["Jwt:ExpiryHours"] ?? "8"));

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub,        user.UserID.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.UserLoginID),
                new Claim(ClaimTypes.Name,                    user.UserName),
                new Claim("UserTypeID",                       user.UserTypeID.ToString()),
                new Claim("CourseID",                         user.CourseID.ToString()),
                new Claim("DistrictID",                       user.DistrictID.ToString()),
                new Claim("DashBoardPath",                    user.DashBoardPath),
                new Claim("SessionID",                        sessionId.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti,        Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer:             _config["Jwt:Issuer"],
                audience:           _config["Jwt:Audience"],
                claims:             claims,
                expires:            expiry,
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
