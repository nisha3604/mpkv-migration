using Microsoft.IdentityModel.Tokens;
using Mpkv.Api.Models.Auth;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Mpkv.Api.Helpers
{
    /// <summary>
    /// Generates and validates JWT tokens.
    /// Claims include UserID, UserTypeID, UserLoginID so every controller
    /// can know whether the caller is Candidate (91), College (61) or Admin (11/12).
    /// </summary>
    public class JwtHelper
    {
        private readonly IConfiguration _config;

        public JwtHelper(IConfiguration config) => _config = config;

        public string GenerateToken(UserInfo user, long sessionId)
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
