using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.College;

namespace Mpkv.Api.Services
{
    public interface IUserProfileService
    {
        UserProfileResponse   GetUserDetails(long userId);
        SaveUserProfileResponse EditUser(long userId, int userTypeId, string userLoginId,
                                         string ipAddress, SaveUserProfileRequest request);
    }

    /// <summary>
    /// Mirrors EditUserProfile.aspx.cs + ManageUsersWorker.cs
    /// GetUserDetails:  Administration_GetUserDetails(@UserID)
    /// EditUser:        Administration_EditUser(7 params) → "Y" on success
    /// </summary>
    public class UserProfileService : IUserProfileService
    {
        private readonly DbAccess _db;
        public UserProfileService(DbAccess db) => _db = db;

        // ── GetUserDetails — mirrors GetUserDetails() in EditUserProfile.aspx.cs ──
        public UserProfileResponse GetUserDetails(long userId)
        {
            try
            {
                var param = new DynamicParameters();
                param.Add("@UserID", userId);
                var dt = _db.GetDataTable("Administration_GetUserDetails", param);

                if (dt == null || dt.Rows.Count == 0 ||
                    dt.Rows[0]["UserID"] == DBNull.Value ||
                    Convert.ToInt64(dt.Rows[0]["UserID"]) == 0)
                    return new UserProfileResponse { Success = false, Message = "User not found." };

                var row = dt.Rows[0];
                bool H(string n) => dt.Columns.Contains(n);

                return new UserProfileResponse
                {
                    Success = true,
                    Profile = new UserProfileDto
                    {
                        // Mirrors: txtUserName.Text = entity.UserName.ToUpper()
                        UserName     = H("UserName")     ? (row["UserName"]?.ToString()     ?? "").ToUpper() : "",
                        UserMobileNo = H("UserMobileNo") ? row["UserMobileNo"]?.ToString()  ?? "" : "",
                        // Mirrors: txtUserEMailID.Text = entity.UserEMailID.ToLower()
                        UserEMailID  = H("UserEMailID")  ? (row["UserEMailID"]?.ToString()  ?? "").ToLower() : "",
                    }
                };
            }
            catch (Exception ex)
            {
                return new UserProfileResponse { Success = false, Message = ex.Message };
            }
        }

        // ── EditUser — mirrors btnSave_Click in EditUserProfile.aspx.cs ──────────
        public SaveUserProfileResponse EditUser(long userId, int userTypeId, string userLoginId,
                                                 string ipAddress, SaveUserProfileRequest request)
        {
            try
            {
                // Mirrors: entity.UserName = txtUserName.Text.ToUpper()
                //          entity.UserEMailID = txtUserEMailID.Text.ToLower()
                var param = new DynamicParameters();
                param.Add("@UserID",              userId);
                param.Add("@UserTypeID",          userTypeId);
                param.Add("@UserName",             request.UserName.Trim().ToUpper());
                param.Add("@UserMobileNo",         request.UserMobileNo.Trim());
                param.Add("@UserEMailID",          request.UserEMailID.Trim().ToLower());
                param.Add("@ModifiedBy",           userLoginId);
                param.Add("@ModifiedByIPAddress",  ipAddress);

                var result = _db.ExecuteScalar("Administration_EditUser", param)?.ToString() ?? "";

                if (result.ToUpper() == "Y")
                    return new SaveUserProfileResponse { Success = true, Message = "Profile Updated Successfully." };

                return new SaveUserProfileResponse
                {
                    Success = false,
                    Message = result.Length > 0 ? result : "Data has not been saved. Please try again."
                };
            }
            catch (Exception ex)
            {
                return new SaveUserProfileResponse { Success = false, Message = ex.Message };
            }
        }
    }
}
