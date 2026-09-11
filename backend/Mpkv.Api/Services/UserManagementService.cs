using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.Admin;

namespace Mpkv.Api.Services
{
    public interface IUserManagementService
    {
        UserTypesResponse   GetUserTypes(int callerUserTypeId);
        UserListResponse    GetUserList(int userTypeId);
        UserDetailsResponse GetUserDetails(long userId);
        SaveUserResponse    SaveUser(SaveUserRequest req, string modifiedBy, string ipAddress, short regionId = 1);
        ToggleUserResponse  ToggleActive(long userId, string modifiedBy, string ipAddress);
        SendSmsResponse     SendSms(long userId, string userLoginId);
    }

    /// <summary>
    /// Mirrors ManageUsers.aspx + AddEditUsers.aspx from the old project.
    ///
    /// SPs:
    ///   Base_GetMasterTableList(@TableName='Master_UserType', ...)  → user type dropdown
    ///   Administration_GetUsersList(@UserTypeID)                    → user grid
    ///   Administration_GetUserDetails(@UserID)                      → edit pre-fill
    ///   Administration_SaveUser(all params)                         → insert (UserID=0) / update (>0)
    ///   Administration_EditUser(subset params)                      → profile-only edit
    ///   Administration_ActivateOrDeactivateUser(@UserID, ...)       → toggle active
    ///   Base_GetEMailSMS(@Purpose='SendLoginIDPassword', @MessageType='S', @Param1=UserLoginID)
    ///                                                               → SMS template for send-login
    ///
    /// Business rules (from ManageUsers.aspx.cs):
    ///   - UserTypeID 0, 61, 91 are excluded from the dropdown
    ///   - If caller is UserTypeID 11 → remove 11 from dropdown (can't manage own type)
    ///   - If caller is UserTypeID 12 → remove 11 and 12
    ///   - Password auto-generated (8 chars) on Add — never entered manually
    ///   - Password stored as Base64(UTF8(plain)); decoded for display and SMS
    /// </summary>
    public class UserManagementService : IUserManagementService
    {
        private readonly DbAccess           _db;
        private readonly IMessagingService  _msg;

        public UserManagementService(DbAccess db, IMessagingService msg)
        {
            _db  = db;
            _msg = msg;
        }

        // ── USER TYPES DROPDOWN ───────────────────────────────────────────────
        public UserTypesResponse GetUserTypes(int callerUserTypeId)
        {
            var r = new UserTypesResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@TableName",        "Master_UserType");
                p.Add("@DataValueField",   "UserTypeID");
                p.Add("@DataTextField",    "UserType");
                p.Add("@ParentField",      "");
                p.Add("@ParentFieldValue", "");
                p.Add("@OrderByFields",    "UserTypeID");
                var dt = _db.GetDataTable("Base_GetMasterTableList", p);
                bool HC(string n) => dt != null && dt.Columns.Contains(n);

                // Excluded types: 0, 61 (College), 91 (Candidate)
                var excluded = new HashSet<string> { "0", "61", "91", "-1" };
                // Caller type 11 can't manage 11; type 12 can't manage 11 or 12
                if (callerUserTypeId == 11) excluded.Add("11");
                if (callerUserTypeId == 12) { excluded.Add("11"); excluded.Add("12"); }

                if (dt != null)
                    foreach (System.Data.DataRow row in dt.Rows)
                    {
                        var val = row[0]?.ToString() ?? "";
                        if (excluded.Contains(val)) continue;
                        r.Items.Add(new UserTypeItem { Value = val, Text = row[1]?.ToString() ?? "" });
                    }
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── USER LIST ─────────────────────────────────────────────────────────
        public UserListResponse GetUserList(int userTypeId)
        {
            var r = new UserListResponse { UserTypeID = userTypeId };
            try
            {
                var p = new DynamicParameters();
                p.Add("@UserTypeID", userTypeId);
                var dt = _db.GetDataTable("Administration_GetUsersList", p);
                bool HC(string n) => dt != null && dt.Columns.Contains(n);

                if (dt != null)
                    foreach (System.Data.DataRow row in dt.Rows)
                        r.Items.Add(MapUser(row, HC));

                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── GET USER DETAILS (for edit pre-fill) ──────────────────────────────
        public UserDetailsResponse GetUserDetails(long userId)
        {
            var r = new UserDetailsResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@UserID", userId);
                var dt = _db.GetDataTable("Administration_GetUserDetails", p);
                bool HC(string n) => dt != null && dt.Columns.Contains(n);

                if (dt != null && dt.Rows.Count > 0)
                {
                    r.User    = MapUser(dt.Rows[0], HC);
                    r.Success = true;
                }
                else
                {
                    r.Success = false;
                    r.Message = "User not found.";
                }
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── SAVE USER (add = UserID 0, edit = UserID > 0) ────────────────────
        public SaveUserResponse SaveUser(SaveUserRequest req, string modifiedBy, string ipAddress, short regionId = 1)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(req.UserName))
                    return new SaveUserResponse { Success = false, Message = "User name is required." };
                if (string.IsNullOrWhiteSpace(req.UserMobileNo))
                    return new SaveUserResponse { Success = false, Message = "Mobile number is required." };

                if (req.UserID == 0)
                {
                    // Add: auto-generate 8-char password — mirrors Helper.GeneratePassword(8)
                    var plainPwd = GeneratePassword(8);
                    var encPwd   = PasswordHelper.Encode(plainPwd);

                    var p = new DynamicParameters();
                    p.Add("@UserID",              0L);
                    p.Add("@UserTypeID",          req.UserTypeID);
                    p.Add("@UserPassword",        encPwd);
                    p.Add("@UserName",            req.UserName.Trim().ToUpper());
                    p.Add("@UserMobileNo",        req.UserMobileNo.Trim());
                    p.Add("@UserEMailID",         req.UserEMailID.Trim().ToLower());
                    p.Add("@DistrictID",          -1);
                    p.Add("@RegionID",            regionId);
                    p.Add("@ModifiedBy",          modifiedBy);
                    p.Add("@ModifiedByIPAddress", ipAddress);

                    var result = _db.ExecuteScalar("Administration_SaveUser", p)?.ToString() ?? "";
                    bool ok = result.ToUpper() == "Y" || result == "1";
                    return new SaveUserResponse { Success = ok, Message = ok ? "User added successfully." : result };
                }
                else
                {
                    // Edit: update profile only (name, mobile, email) — same as Administration_EditUser
                    var p = new DynamicParameters();
                    p.Add("@UserID",              req.UserID);
                    p.Add("@UserTypeID",          req.UserTypeID);
                    p.Add("@UserName",            req.UserName.Trim().ToUpper());
                    p.Add("@UserMobileNo",        req.UserMobileNo.Trim());
                    p.Add("@UserEMailID",         req.UserEMailID.Trim().ToLower());
                    p.Add("@ModifiedBy",          modifiedBy);
                    p.Add("@ModifiedByIPAddress", ipAddress);

                    var result = _db.ExecuteScalar("Administration_EditUser", p)?.ToString() ?? "";
                    bool ok = result.ToUpper() == "Y" || result == "1";
                    return new SaveUserResponse { Success = ok, Message = ok ? "User updated successfully." : result };
                }
            }
            catch (Exception ex)
            {
                return new SaveUserResponse { Success = false, Message = ex.Message };
            }
        }

        // ── ACTIVATE / DEACTIVATE ─────────────────────────────────────────────
        public ToggleUserResponse ToggleActive(long userId, string modifiedBy, string ipAddress)
        {
            try
            {
                var p = new DynamicParameters();
                p.Add("@UserID",              userId);
                p.Add("@ModifiedBy",          modifiedBy);
                p.Add("@ModifiedByIPAddress", ipAddress);

                var result = _db.ExecuteScalar("Administration_ActivateOrDeactivateUser", p)?.ToString() ?? "";
                bool ok = result.ToUpper() == "Y" || result == "1";
                return new ToggleUserResponse { Success = ok, Message = ok ? "User status updated successfully." : result };
            }
            catch (Exception ex)
            {
                return new ToggleUserResponse { Success = false, Message = ex.Message };
            }
        }

        // ── SEND SMS — login ID + password to user's mobile ──────────────────
        public SendSmsResponse SendSms(long userId, string userLoginId)
        {
            try
            {
                // Get SMS template + mobile via Base_GetEMailSMS
                var p = new DynamicParameters();
                p.Add("@Purpose",     "SendLoginIDPassword");
                p.Add("@MessageType", "S");
                p.Add("@Param1",      userLoginId);
                p.Add("@Param2",      "");
                p.Add("@Param3",      "");
                p.Add("@Param4",      "");
                p.Add("@Param5",      "");
                var dt = _db.GetDataTable("Base_GetEMailSMS", p);

                if (dt == null || dt.Rows.Count == 0)
                    return new SendSmsResponse { Success = false, Message = "Could not retrieve SMS template." };

                var row        = dt.Rows[0];
                bool HC(string n) => dt.Columns.Contains(n) && row[n] != DBNull.Value;
                var mobileNo   = HC("MobileNo")   ? row["MobileNo"]?.ToString()   ?? "" : "";
                var templateId = HC("TemplateID") ? row["TemplateID"]?.ToString() ?? "" : "";
                var message    = HC("Message")    ? row["Message"]?.ToString()    ?? "" : "";

                // Decode the stored password for the SMS message
                var userDt = GetUserDetails(userId);
                if (userDt.User != null)
                    message = message.Replace("##Password##", userDt.User.Password);

                if (string.IsNullOrWhiteSpace(mobileNo))
                    return new SendSmsResponse { Success = false, Message = "No mobile number found for this user." };

                _ = _msg.SendSmsAsync(mobileNo, message, templateId);
                return new SendSmsResponse { Success = true, Message = "Login ID and Password has been sent to Registered Mobile Number." };
            }
            catch (Exception ex)
            {
                return new SendSmsResponse { Success = false, Message = ex.Message };
            }
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        private static UserItem MapUser(System.Data.DataRow row, Func<string, bool> HC) => new()
        {
            UserID       = HC("UserID")       && row["UserID"]       != DBNull.Value ? Convert.ToInt64(row["UserID"])  : 0,
            UserTypeID   = HC("UserTypeID")   && row["UserTypeID"]   != DBNull.Value ? Convert.ToInt32(row["UserTypeID"]) : 0,
            UserType     = HC("UserType")     ? row["UserType"]?.ToString()     ?? "" : "",
            UserLoginID  = HC("UserLoginID")  ? row["UserLoginID"]?.ToString()  ?? "" : "",
            // Decode Base64 password for display — mirrors gvUsersList_RowDataBound
            Password     = HC("UserPassword") ? PasswordHelper.Decode(row["UserPassword"]?.ToString() ?? "") : "",
            UserName     = HC("UserName")     ? row["UserName"]?.ToString()     ?? "" : "",
            UserMobileNo = HC("UserMobileNo") ? row["UserMobileNo"]?.ToString() ?? "" : "",
            UserEMailID  = HC("UserEMailID")  ? row["UserEMailID"]?.ToString()  ?? "" : "",
            IsActive     = HC("IsActive")     ? row["IsActive"]?.ToString()     ?? "" : "",
            ActivOrDeactive = HC("ActivOrDeactive") ? row["ActivOrDeactive"]?.ToString() ?? "" : "",
        };

        /// <summary>
        /// Mirrors Helper.GeneratePassword(length) from old project.
        /// Generates a random password with at least 1 upper, 1 lower, 1 digit, 1 special.
        /// </summary>
        private static string GeneratePassword(int length)
        {
            const string upper   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const string lower   = "abcdefghijklmnopqrstuvwxyz";
            const string digits  = "0123456789";
            const string special = "@#$!";
            const string all     = upper + lower + digits + special;
            var rng  = new Random();
            var pwd  = new char[length];
            pwd[0]   = upper[rng.Next(upper.Length)];
            pwd[1]   = lower[rng.Next(lower.Length)];
            pwd[2]   = digits[rng.Next(digits.Length)];
            pwd[3]   = special[rng.Next(special.Length)];
            for (int i = 4; i < length; i++) pwd[i] = all[rng.Next(all.Length)];
            return new string(pwd.OrderBy(_ => rng.Next()).ToArray());
        }
    }
}
