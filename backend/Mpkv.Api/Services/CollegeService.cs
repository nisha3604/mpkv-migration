using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.College;

namespace Mpkv.Api.Services
{
    public interface ICollegeService
    {
        // Summary
        CollegeSummaryResponse  GetSummary(long collegeId);
        // Edit form — load
        CollegeDetailsResponse  GetDetails(long collegeId);
        // Edit form — save
        CollegeActionResponse   SaveDetails(long collegeId, int userTypeId, string userLoginId, string ipAddress, SaveCollegeRequest request);
        // Activate / Deactivate (admin only)
        CollegeActionResponse   SetActiveStatus(long collegeId, bool isActive, string userLoginId, string ipAddress);
        // Admin: list/search
        CollegeListResponse     GetList(CollegeListRequest request);
        // Admin: password list (decoded)
        CollegePasswordListResponse GetPasswordList(CollegeListRequest request);
        // Admin: current password for a college (decoded)
        CurrentPasswordResponse GetCurrentPassword(string collegeCode);
        // Admin: reset password
        ResetCollegePasswordResponse ResetPassword(ResetCollegePasswordRequest request, string loggedInUserLoginId, string ipAddress);
    }

    /// <summary>
    /// Mirrors CollegeWorker.cs + Repository.College.cs from the old project.
    /// All 9 college SPs are called here.
    /// </summary>
    public class CollegeService : ICollegeService
    {
        private readonly DbAccess _db;

        public CollegeService(DbAccess db) => _db = db;

        // ══════════════════════════════════════════════════════════════════════
        // GetSummary — CollegeSummary.aspx Page_Load
        // SP: College_GetCollegeSummary(@CollegeID)
        // ══════════════════════════════════════════════════════════════════════
        public CollegeSummaryResponse GetSummary(long collegeId)
        {
            try
            {
                var param = new DynamicParameters();
                param.Add("@CollegeID", collegeId);
                var dt = _db.GetDataTable("College_GetCollegeSummary", param);
                if (dt == null || dt.Rows.Count == 0)
                    return new CollegeSummaryResponse { Success = false, Message = "College not found." };

                return new CollegeSummaryResponse { Success = true, College = MapSummary(dt.Rows[0], dt) };
            }
            catch (Exception ex) { return new CollegeSummaryResponse { Success = false, Message = ex.Message }; }
        }

        // ══════════════════════════════════════════════════════════════════════
        // GetDetails — EditCollegeDetails.aspx Page_Load (load form)
        // SP: College_GetCollegeDetails(@CollegeID)
        // Also loads master dropdowns: districts, courses, coursestatuses
        // ══════════════════════════════════════════════════════════════════════
        public CollegeDetailsResponse GetDetails(long collegeId)
        {
            var response = new CollegeDetailsResponse();
            try
            {
                var param = new DynamicParameters();
                param.Add("@CollegeID", collegeId);
                var dt = _db.GetDataTable("College_GetCollegeDetails", param);
                if (dt == null || dt.Rows.Count == 0)
                    return new CollegeDetailsResponse { Success = false, Message = "College not found." };

                response.Details = MapSummary(dt.Rows[0], dt);
                response.Success = true;

                // Load master dropdowns (same as old EditCollegeDetails.aspx LoadMasters())
                response.Districts     = GetDropdown("Base_GetMasterDistrict");
                response.Courses       = GetDropdown("Base_GetMasterCourse");
                response.CourseStatuses = GetDropdown("Base_GetMasterCourseStatus");
            }
            catch (Exception ex) { response.Success = false; response.Message = ex.Message; }
            return response;
        }

        // ══════════════════════════════════════════════════════════════════════
        // SaveDetails — EditCollegeDetails.aspx btnSave_Click
        // SP: College_SaveCollegeDetails (22 params)
        // Returns: 3-char CollegeCode on success (not "Y") — old code checks length == 3
        // UserTypeID 61 = College user: admin-only fields are fetched from DB first, not overwritten
        // ══════════════════════════════════════════════════════════════════════
        public CollegeActionResponse SaveDetails(long collegeId, int userTypeId, string userLoginId, string ipAddress, SaveCollegeRequest req)
        {
            try
            {
                var param = new DynamicParameters();
                param.Add("@CollegeID", collegeId);

                if (UserTypeHelper.IsAdmin(userTypeId))
                {
                    // Admin can edit ALL fields
                    param.Add("@CollegeCode",                req.CollegeCode);
                    param.Add("@CollegeName",                req.CollegeName);
                    param.Add("@DistrictID",                 req.DistrictID);
                    param.Add("@CourseID",                   req.CourseID);
                    param.Add("@CourseStatusID",             req.CourseStatusID);
                    param.Add("@Intake",                     req.Intake);
                    param.Add("@HasManagementQuota",         req.HasManagementQuota);
                }
                else
                {
                    // College user (61): locked fields must come from DB to prevent tampering
                    var existing = GetSummary(collegeId).College;
                    if (existing == null)
                        return new CollegeActionResponse { Success = false, Message = "College not found." };
                    param.Add("@CollegeCode",        existing.CollegeCode);
                    param.Add("@CollegeName",        existing.CollegeName);
                    param.Add("@DistrictID",         existing.DistrictID);
                    param.Add("@CourseID",           existing.CourseID);
                    param.Add("@CourseStatusID",     existing.CourseStatusID);
                    param.Add("@Intake",             existing.Intake);
                    param.Add("@HasManagementQuota", existing.HasManagementQuotaValue);
                }

                // Editable by all
                param.Add("@CollegeAddress",             req.CollegeAddress.Trim());
                param.Add("@Taluka",                     req.Taluka.Trim());
                param.Add("@City",                       req.City.Trim());
                param.Add("@Pincode",                    req.Pincode.Trim());
                param.Add("@MobileNo",                   req.MobileNo.Trim());
                param.Add("@EMailID",                    req.EmailID.Trim().ToLower());
                param.Add("@PrincipalName",              req.PrincipalName.Trim());
                param.Add("@PrincipalEMailID",           req.PrincipalEmailID.Trim().ToLower());
                param.Add("@PrincipalMobileNo",          req.PrincipalMobileNo.Trim());
                param.Add("@AdmissionInchargeName",      req.AdmissionInchargeName.Trim());
                param.Add("@AdmissionInchargeEMailID",   req.AdmissionInchargeEmailID.Trim().ToLower());
                param.Add("@AdmissionInchargeMobileNo",  req.AdmissionInchargeMobileNo.Trim());
                param.Add("@UserLoginID",                userLoginId);
                param.Add("@IPAddress",                  ipAddress);

                var result = _db.ExecuteScalar("College_SaveCollegeDetails", param)?.ToString() ?? "";

                // Old code checks: returnValue.Length == 3 (returns CollegeCode on success)
                if (result.Length == 3)
                    return new CollegeActionResponse { Success = true, Message = "College details saved successfully." };

                return new CollegeActionResponse { Success = false, Message = result.Length > 0 ? result : "Failed to save college details." };
            }
            catch (Exception ex) { return new CollegeActionResponse { Success = false, Message = ex.Message }; }
        }

        // ══════════════════════════════════════════════════════════════════════
        // SetActiveStatus — CollegeSummary.aspx btnActivate/btnDeactivate_Click
        // SP: College_SaveCollegeActiveStatus(@CollegeID, @IsActive, @UserLoginID, @IPAddress)
        // ══════════════════════════════════════════════════════════════════════
        public CollegeActionResponse SetActiveStatus(long collegeId, bool isActive, string userLoginId, string ipAddress)
        {
            try
            {
                var param = new DynamicParameters();
                param.Add("@CollegeID",   collegeId);
                param.Add("@IsActive",    isActive ? 1 : 0);
                param.Add("@UserLoginID", userLoginId);
                param.Add("@IPAddress",   ipAddress);
                var result = _db.ExecuteScalar("College_SaveCollegeActiveStatus", param)?.ToString() ?? "";
                bool ok = result.ToUpper() == "Y" || result == "1";
                return new CollegeActionResponse
                {
                    Success = ok,
                    Message = ok ? $"College {(isActive ? "activated" : "deactivated")} successfully." : result
                };
            }
            catch (Exception ex) { return new CollegeActionResponse { Success = false, Message = ex.Message }; }
        }

        // ══════════════════════════════════════════════════════════════════════
        // GetList — CollegeList.aspx search/filter
        // SP: College_GetCollegeList(@CourseID, @DistrictID, @CollegeCode, @CollegeName)
        // ══════════════════════════════════════════════════════════════════════
        public CollegeListResponse GetList(CollegeListRequest request)
        {
            try
            {
                var param = new DynamicParameters();
                param.Add("@CourseID",    request.CourseID);
                param.Add("@DistrictID",  request.DistrictID);
                param.Add("@CollegeCode", request.CollegeCode ?? "");
                param.Add("@CollegeName", request.CollegeName ?? "");
                var dt = _db.GetDataTable("College_GetCollegeList", param);
                var list = new List<CollegeListItem>();
                if (dt != null)
                {
                    bool H(System.Data.DataRow row, string n) => dt.Columns.Contains(n) && row[n] != DBNull.Value;
                    foreach (System.Data.DataRow row in dt.Rows)
                    {
                        list.Add(new CollegeListItem
                        {
                            CollegeID    = H(row, "CollegeID")    ? Convert.ToInt64(row["CollegeID"])  : 0,
                            CollegeCode  = H(row, "CollegeCode")  ? row["CollegeCode"]?.ToString()  ?? "" : "",
                            CollegeName  = H(row, "CollegeName")  ? row["CollegeName"]?.ToString()  ?? "" : "",
                            District     = H(row, "District")     ? row["District"]?.ToString()     ?? "" : "",
                            Course       = H(row, "Course")       ? row["Course"]?.ToString()       ?? "" : "",
                            CourseStatus = H(row, "CourseStatus") ? row["CourseStatus"]?.ToString() ?? "" : "",
                            Status       = H(row, "CurrentStatus")? row["CurrentStatus"]?.ToString()?? "" : "",
                            IsActive     = H(row, "IsActive")     && Convert.ToBoolean(row["IsActive"])
                        });
                    }
                }
                return new CollegeListResponse { Success = true, Colleges = list };
            }
            catch (Exception ex) { return new CollegeListResponse { Success = false, Message = ex.Message }; }
        }

        // ══════════════════════════════════════════════════════════════════════
        // GetPasswordList — GetCollegePassword.aspx (admin only)
        // SP: College_GetCollegeList(@CourseID=0, @DistrictID, @CollegeCode, @CollegeName)
        // Decodes Base64 password for display
        // ══════════════════════════════════════════════════════════════════════
        public CollegePasswordListResponse GetPasswordList(CollegeListRequest request)
        {
            try
            {
                var param = new DynamicParameters();
                param.Add("@CourseID",    0);
                param.Add("@DistrictID",  request.DistrictID);
                param.Add("@CollegeCode", request.CollegeCode ?? "");
                param.Add("@CollegeName", request.CollegeName ?? "");
                var dt = _db.GetDataTable("College_GetCollegeList", param);
                var list = new List<CollegePasswordItem>();
                if (dt != null)
                {
                    bool H(System.Data.DataRow row, string n) => dt.Columns.Contains(n) && row[n] != DBNull.Value;
                    foreach (System.Data.DataRow row in dt.Rows)
                    {
                        var encoded = H(row, "UserPassword") ? row["UserPassword"]?.ToString() ?? "" : "";
                        list.Add(new CollegePasswordItem
                        {
                            CollegeCode = H(row, "CollegeCode") ? row["CollegeCode"]?.ToString() ?? "" : "",
                            CollegeName = H(row, "CollegeName") ? row["CollegeName"]?.ToString() ?? "" : "",
                            District    = H(row, "District")    ? row["District"]?.ToString()    ?? "" : "",
                            MobileNo    = H(row, "MobileNo")    ? row["MobileNo"]?.ToString()    ?? "" : "",
                            Password    = PasswordHelper.Decode(encoded)  // Base64 decode for admin display
                        });
                    }
                }
                return new CollegePasswordListResponse { Success = true, Colleges = list };
            }
            catch (Exception ex) { return new CollegePasswordListResponse { Success = false, Message = ex.Message }; }
        }

        // ══════════════════════════════════════════════════════════════════════
        // GetCurrentPassword — ResetCollegePassword.aspx (show current password)
        // SP: Account_GetUserPassword(@UserLoginID=CollegeCode)
        // Returns decoded plaintext so admin can see it
        // ══════════════════════════════════════════════════════════════════════
        public CurrentPasswordResponse GetCurrentPassword(string collegeCode)
        {
            try
            {
                var param = new DynamicParameters();
                param.Add("@UserLoginID", collegeCode);
                var result = _db.ExecuteScalar("Account_GetUserPassword", param)?.ToString() ?? "";
                return new CurrentPasswordResponse
                {
                    Success         = true,
                    CurrentPassword = PasswordHelper.Decode(result)
                };
            }
            catch (Exception ex) { return new CurrentPasswordResponse { Success = false, Message = ex.Message }; }
        }

        // ══════════════════════════════════════════════════════════════════════
        // ResetPassword — ResetCollegePassword.aspx btnSave_Click
        // SP: Account_ResetPassword(@UserID, @NewPassword(Base64), @LoggedInUserLoginID, @IPAddress)
        // Validates complexity first, then saves encoded password
        // ══════════════════════════════════════════════════════════════════════
        public ResetCollegePasswordResponse ResetPassword(ResetCollegePasswordRequest request, string loggedInUserLoginId, string ipAddress)
        {
            try
            {
                if (request.NewPassword != request.ConfirmPassword)
                    return new ResetCollegePasswordResponse { Success = false, Message = "Passwords do not match." };

                if (!PasswordHelper.IsValidPassword(request.NewPassword))
                    return new ResetCollegePasswordResponse { Success = false, Message = "Password must be 8–15 characters with at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character." };

                // Get CollegeID (UserID) from college code
                var uidParam = new DynamicParameters();
                uidParam.Add("@UserLoginID", request.CollegeCode);
                var uid = _db.ExecuteScalar("Account_GetUserID", uidParam);
                if (uid == null)
                    return new ResetCollegePasswordResponse { Success = false, Message = "College not found." };
                long userId = Convert.ToInt64(uid);

                var param = new DynamicParameters();
                param.Add("@UserID",              userId);
                param.Add("@NewPassword",          PasswordHelper.Encode(request.NewPassword));
                param.Add("@LoggedInUserLoginID",  loggedInUserLoginId);
                param.Add("@IPAddress",            ipAddress);

                var result = _db.ExecuteScalar("Account_ResetPassword", param)?.ToString() ?? "";
                bool ok = result.ToUpper() == "Y" || result == "1";
                return new ResetCollegePasswordResponse
                {
                    Success         = ok,
                    Message         = ok ? "Password reset successfully." : (result.Length > 0 ? result : "Failed to reset password."),
                    UpdatedPassword = ok ? request.NewPassword : ""
                };
            }
            catch (Exception ex) { return new ResetCollegePasswordResponse { Success = false, Message = ex.Message }; }
        }

        // ── Private helpers ───────────────────────────────────────────────────

        private CollegeSummaryDto MapSummary(System.Data.DataRow row, System.Data.DataTable dt)
        {
            bool H(string n) => dt.Columns.Contains(n) && row[n] != DBNull.Value;
            return new CollegeSummaryDto
            {
                CollegeID               = H("CollegeID")               ? Convert.ToInt64(row["CollegeID"])    : 0,
                CollegeCode             = H("CollegeCode")             ? row["CollegeCode"]?.ToString()             ?? "" : "",
                CollegeName             = H("CollegeName")             ? row["CollegeName"]?.ToString()             ?? "" : "",
                CollegeAddress          = H("CollegeAddress")          ? row["CollegeAddress"]?.ToString()          ?? "" : "",
                District                = H("District")                ? row["District"]?.ToString()                ?? "" : "",
                DistrictID              = H("DistrictID")              ? Convert.ToInt32(row["DistrictID"])         : 0,
                Taluka                  = H("Taluka")                  ? row["Taluka"]?.ToString()                  ?? "" : "",
                City                    = H("City")                    ? row["City"]?.ToString()                    ?? "" : "",
                Pincode                 = H("Pincode")                 ? row["Pincode"]?.ToString()                 ?? "" : "",
                MobileNo                = H("MobileNo")                ? row["MobileNo"]?.ToString()                ?? "" : "",
                EmailID                 = H("EMailID")                 ? row["EMailID"]?.ToString()                 ?? "" : "",
                Course                  = H("Course")                  ? row["Course"]?.ToString()                  ?? "" : "",
                CourseID                = H("CourseID")                ? Convert.ToInt16(row["CourseID"])            : (short)0,
                CourseStatus            = H("CourseStatus")            ? row["CourseStatus"]?.ToString()            ?? "" : "",
                CourseStatusID          = H("CourseStatusID")          ? Convert.ToInt16(row["CourseStatusID"])      : (short)0,
                Intake                  = H("Intake")                  ? Convert.ToInt16(row["Intake"])              : (short)0,
                HasManagementQuota      = H("HasManagementQuota")      ? (Convert.ToInt16(row["HasManagementQuota"]) == 1 ? "YES" : "NO") : "NO",
                HasManagementQuotaValue = H("HasManagementQuota")      ? Convert.ToInt16(row["HasManagementQuota"])  : (short)0,
                PrincipalName           = H("PrincipalName")           ? row["PrincipalName"]?.ToString()           ?? "" : "",
                PrincipalEmailID        = H("PrincipalEMailID")        ? row["PrincipalEMailID"]?.ToString()        ?? "" : "",
                PrincipalMobileNo       = H("PrincipalMobileNo")       ? row["PrincipalMobileNo"]?.ToString()       ?? "" : "",
                AdmissionInchargeName   = H("AdmissionInchargeName")   ? row["AdmissionInchargeName"]?.ToString()   ?? "" : "",
                AdmissionInchargeEmailID= H("AdmissionInchargeEMailID")? row["AdmissionInchargeEMailID"]?.ToString()?? "" : "",
                AdmissionInchargeMobileNo=H("AdmissionInchargeMobileNo")?row["AdmissionInchargeMobileNo"]?.ToString()??"" : "",
                IsActive                = H("IsActive")                && Convert.ToBoolean(row["IsActive"])
            };
        }

        private List<DropdownItem> GetDropdown(string spName, DynamicParameters? param = null)
        {
            var list = new List<DropdownItem>();
            try
            {
                var dt = _db.GetDataTable(spName, param);
                if (dt == null) return list;
                foreach (System.Data.DataRow row in dt.Rows)
                {
                    var val = row[0]?.ToString() ?? "";
                    if (val == "-1") continue;
                    list.Add(new DropdownItem { Value = val, Text = row[1]?.ToString() ?? "" });
                }
            }
            catch { /* non-critical */ }
            return list;
        }
    }
}
