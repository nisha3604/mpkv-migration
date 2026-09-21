using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.Admin;

namespace Mpkv.Api.Services
{
    public interface ICandidateUtilsService
    {
        SearchCandidateResponse        Search(SearchCandidateRequest req);
        CandidatePasswordInfoResponse  GetPasswordInfo(string applicationId);
        ResetCandidatePasswordResponse ResetPassword(ResetCandidatePasswordRequest req, string modifiedBy, string ipAddress);
        DocVerificationStatusResponse  GetDocVerificationStatus(long candidateId, string userLoginId);
        UnlockCandidateFormResponse    UnlockCandidateForm(string applicationId, string adminLoginId, string ipAddress);
        ChangeMobileEmailResponse      ChangeMobileEmail(string applicationId, string? newMobile, string? newEmail, string adminLoginId, string ipAddress);
        AdminSecurityQuestionResponse  GetSecurityQuestionDetails(string applicationId);
        ChangeMobileEmailResponse      ChangeSecurityQuestion(string applicationId, int securityQuestionId, string answer, string adminLoginId, string ipAddress);
    }

    /// <summary>
    /// Mirrors Admin/SearchCandidate.aspx, Admin/ResetCandidatePassword.aspx,
    ///          Admin/CheckDocumentVerificationStatus.aspx
    ///
    /// SPs:
    ///   Base_SearchCandidate(@SearchCandidateBy, @SearchQuery)
    ///   Base_GetCandidateID(@ApplicationID)
    ///   Account_GetUserName(@UserLoginID) — for candidate name on reset page
    ///   Account_GetUserPassword(@UserLoginID) — for current password display (decoded)
    ///   Account_ResetPassword(entity) — saves new password
    ///   ApplicationForm_GetRequiredDocumentsList (via RequiredDocumentWorker)
    ///     → SP: ApplicationForm_GetRequiredDocumentsList(@CandidateID, @UserLoginID, @PageCode)
    /// </summary>
    public class CandidateUtilsService : ICandidateUtilsService
    {
        private readonly DbAccess _db;
        public CandidateUtilsService(DbAccess db) => _db = db;

        // ── Search ────────────────────────────────────────────────────────────
        public SearchCandidateResponse Search(SearchCandidateRequest req)
        {
            var r = new SearchCandidateResponse();
            try
            {
                if (string.IsNullOrWhiteSpace(req.SearchText))
                    return new SearchCandidateResponse { Success = false, Message = "Please enter search text." };

                // Build the search query string exactly as old project's SearchCandidate.aspx.cs did
                // SP Base_SearchCandidate expects @SearchCandidateBy and a SQL WHERE fragment in @SearchQuery
                string searchQuery = req.SearchBy switch
                {
                    "ApplicationID" => $"ApplicationID = '{req.SearchText.Trim()}'",
                    "MobileNo"      => $"MobileNo = '{req.SearchText.Trim()}'",
                    "EMailID"       => $"EMailID = '{req.SearchText.Trim()}'",
                    "CandidateName" => string.Join(" AND ",
                        req.SearchText.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries)
                            .Select(w => $"CandidateName LIKE '%{w}%'")),
                    _               => $"ApplicationID = '{req.SearchText.Trim()}'"
                };

                var p = new DynamicParameters();
                p.Add("@SearchCandidateBy", req.SearchBy);
                p.Add("@SearchQuery",       searchQuery);
                var dt = _db.GetDataTable("Base_SearchCandidate", p);
                bool HC(string n) => dt != null && dt.Columns.Contains(n);

                if (dt != null)
                    foreach (System.Data.DataRow row in dt.Rows)
                        r.Items.Add(new CandidateSearchRow
                        {
                            CandidateID   = HC("CandidateID")   && row["CandidateID"]   != DBNull.Value ? Convert.ToInt64(row["CandidateID"]) : 0,
                            ApplicationID = HC("ApplicationID") ? row["ApplicationID"]?.ToString() ?? "" : "",
                            CandidateName = HC("CandidateName") ? row["CandidateName"]?.ToString() ?? "" : "",
                            Gender        = HC("Gender")        ? row["Gender"]?.ToString()        ?? "" : "",
                            DOB           = HC("DOB")           ? row["DOB"]?.ToString()           ?? "" : "",
                            MobileNo      = HC("MobileNo")      ? row["MobileNo"]?.ToString()      ?? "" : "",
                            EMailID       = HC("EMailID")       ? row["EMailID"]?.ToString()       ?? "" : "",
                        });

                r.Success = true;
                if (r.Items.Count == 0) r.Message = "No records found.";
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── Get password info for reset page ──────────────────────────────────
        public CandidatePasswordInfoResponse GetPasswordInfo(string applicationId)
        {
            var r = new CandidatePasswordInfoResponse();
            try
            {
                // Resolve CandidateID → ApplicationID is the UserLoginID for candidates
                var p1 = new DynamicParameters(); p1.Add("@ApplicationID", applicationId.Trim().ToUpper());
                var idObj = _db.ExecuteScalar("Base_GetCandidateID", p1);
                if (idObj == null || Convert.ToInt64(idObj) == 0)
                    return new CandidatePasswordInfoResponse { Success = false, Message = "Invalid Application ID." };

                r.CandidateID   = Convert.ToInt64(idObj);
                r.ApplicationID = applicationId.Trim().ToUpper();

                // Get candidate name
                var p2 = new DynamicParameters(); p2.Add("@CandidateID", r.CandidateID);
                r.CandidateName = _db.ExecuteScalar("Base_GetCandidateName", p2)?.ToString() ?? "";

                // Get decoded current password
                var p3 = new DynamicParameters(); p3.Add("@UserLoginID", r.ApplicationID);
                var encodedPwd = _db.ExecuteScalar("Account_GetUserPassword", p3)?.ToString() ?? "";
                r.CurrentPassword = PasswordHelper.Decode(encodedPwd);

                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── Reset password ────────────────────────────────────────────────────
        public ResetCandidatePasswordResponse ResetPassword(ResetCandidatePasswordRequest req, string modifiedBy, string ipAddress)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(req.NewPassword))
                    return new ResetCandidatePasswordResponse { Success = false, Message = "New password is required." };
                if (req.NewPassword != req.ConfirmPassword)
                    return new ResetCandidatePasswordResponse { Success = false, Message = "Password and Confirm Password should be the same." };
                if (!PasswordHelper.IsValidPassword(req.NewPassword))
                    return new ResetCandidatePasswordResponse { Success = false, Message = "Password must be 8-15 chars with at least 1 uppercase, 1 lowercase, 1 digit and 1 special character." };

                var p = new DynamicParameters();
                p.Add("@UserID",              req.CandidateID);
                p.Add("@NewPassword",         PasswordHelper.Encode(req.NewPassword));
                p.Add("@LoggedInUserLoginID", modifiedBy);
                p.Add("@IPAddress",           ipAddress);
                var result = _db.ExecuteScalar("Account_ResetPassword", p)?.ToString() ?? "";
                bool ok = result.ToUpper() == "Y" || result == "1";
                return new ResetCandidatePasswordResponse { Success = ok, Message = ok ? "Password changed successfully." : result };
            }
            catch (Exception ex) { return new ResetCandidatePasswordResponse { Success = false, Message = ex.Message }; }
        }

        // ── Document Verification Status (read-only) ──────────────────────────
        public DocVerificationStatusResponse GetDocVerificationStatus(long candidateId, string userLoginId)
        {
            var r = new DocVerificationStatusResponse();
            try
            {
                // Get candidate name + application ID
                var p1 = new DynamicParameters(); p1.Add("@CandidateID", candidateId);
                r.CandidateName = _db.ExecuteScalar("Base_GetCandidateName", p1)?.ToString() ?? "";
                r.ApplicationID = _db.ExecuteScalar("Base_GetApplicationID", p1)?.ToString() ?? "";

                // Get document list
                var p2 = new DynamicParameters();
                p2.Add("@CandidateID", candidateId);
                p2.Add("@UserLoginID", userLoginId);
                p2.Add("@PageCode",    "CheckDocumentVerificationStatus");
                var dt = _db.GetDataTable("ApplicationForm_GetRequiredDocumentsList", p2);
                bool HC(string n) => dt != null && dt.Columns.Contains(n);

                if (dt != null)
                    foreach (System.Data.DataRow row in dt.Rows)
                        r.Documents.Add(new DocVerificationRow
                        {
                            DocumentID                = HC("DocumentID")               && row["DocumentID"]               != DBNull.Value ? Convert.ToInt32(row["DocumentID"]) : 0,
                            DocumentName              = HC("DocumentName")              ? row["DocumentName"]?.ToString()              ?? "" : "",
                            IsDocumentCompulsory      = HC("IsDocumentCompulsory")      ? row["IsDocumentCompulsory"]?.ToString()      ?? "" : "",
                            IsDocumentUploaded        = HC("IsDocumentUploaded")        ? row["IsDocumentUploaded"]?.ToString()        ?? "" : "",
                            DocumentUploadedURL       = HC("DocumentUploadedURL")       ? row["DocumentUploadedURL"]?.ToString()       ?? "" : "",
                            DocumentVerificationStatus   = HC("DocumentVerificationStatus")  ? row["DocumentVerificationStatus"]?.ToString()  ?? "" : "",
                            DocumentVerificationComments = HC("DocumentVerificationComments")? row["DocumentVerificationComments"]?.ToString() ?? "" : "",
                            DocumentVerificationDate     = HC("DocumentVerificationDate")    ? row["DocumentVerificationDate"]?.ToString()    ?? "" : "",
                        });

                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── Unlock Candidate Form (Admin Override) ────────────────────────────
        // Mirrors ApplicationFormUnlock.aspx.cs CloseConfirmBoxYes (admin branch)
        // SP: ApplicationForm_UnlockForm(@CandidateID, @UserLoginID, @IPAddress, @PageCode)
        // Returns "Y" on success, error message string on failure.
        public UnlockCandidateFormResponse UnlockCandidateForm(string applicationId, string adminLoginId, string ipAddress)
        {
            try
            {
                // Step 1 — resolve ApplicationID → CandidateID
                var pwdInfo = GetPasswordInfo(applicationId);
                if (!pwdInfo.Success || pwdInfo.CandidateID == 0)
                    return new UnlockCandidateFormResponse { Success = false, Message = $"Candidate not found for Application ID: {applicationId}" };

                // Step 2 — unlock using same SP as candidate self-unlock
                // IMPORTANT: @UserLoginID must be the candidate's ApplicationID (their login ID),
                // not the admin's login ID. The SP uses UserLoginID to look up UserTypeID for auth.
                // The admin identity is recorded separately via @IPAddress + PageCode audit trail.
                var p = new DynamicParameters();
                p.Add("@CandidateID", pwdInfo.CandidateID);
                p.Add("@UserLoginID", pwdInfo.ApplicationID);  // candidate's login ID, not admin's
                p.Add("@IPAddress",   ipAddress);
                p.Add("@PageCode",    "ApplicationFormUnlock");
                var result = _db.ExecuteScalar("ApplicationForm_UnlockForm", p)?.ToString() ?? "";

                if (result.ToUpper() == "Y")
                    return new UnlockCandidateFormResponse { Success = true,  Message = "Application form unlocked successfully. The candidate can now edit their form." };

                return new UnlockCandidateFormResponse { Success = false, Message = result.Length > 0 ? result : "Failed to unlock. Please try again." };
            }
            catch (Exception ex)
            {
                return new UnlockCandidateFormResponse { Success = false, Message = ex.Message };
            }
        }

        // ── Change Mobile No. / E-Mail ID (Admin override) ───────────────────        // Mirrors Admin/CheckApplicationID.aspx?Flag=ChangeMobileEMail →
        //         Candidate/ChangeMobileEMail.aspx
        // SPs: Base_GetCandidateID, ApplicationForm_IsApplicationFormAlreadyRegisteredUsingThisMobileNo,
        //      Account_ChangeCandidateMobileNo, ApplicationForm_IsApplicationFormAlreadyRegisteredUsingThisEMailID,
        //      Account_ChangeCandidateEMailID
        public ChangeMobileEmailResponse ChangeMobileEmail(
            string applicationId, string? newMobile, string? newEmail,
            string adminLoginId, string ipAddress)
        {
            try
            {
                // Resolve CandidateID
                var idP = new DynamicParameters();
                idP.Add("@ApplicationID", applicationId.Trim());
                var candidateId = _db.ExecuteScalar("Base_GetCandidateID", idP);
                if (candidateId == null || Convert.ToInt64(candidateId) == 0)
                    return new ChangeMobileEmailResponse { Success = false, Message = "Invalid Application ID." };

                long cid = Convert.ToInt64(candidateId);
                var mobileMsg = "";
                var emailMsg  = "";

                // ── Change Mobile Number ──────────────────────────────────────
                if (!string.IsNullOrWhiteSpace(newMobile))
                {
                    var dupP = new DynamicParameters();
                    dupP.Add("@CandidateID", cid);
                    dupP.Add("@MobileNo",    newMobile.Trim());
                    var dup = _db.ExecuteScalar("ApplicationForm_IsApplicationFormAlreadyRegisteredUsingThisMobileNo", dupP);
                    if (dup != null && Convert.ToBoolean(dup))
                        return new ChangeMobileEmailResponse { Success = false, Message = $"Mobile Number {newMobile} is already registered. Please use a different mobile number." };

                    var p = new DynamicParameters();
                    p.Add("@CandidateID", cid);
                    p.Add("@MobileNo",    newMobile.Trim());
                    p.Add("@UserLoginID", adminLoginId);
                    p.Add("@IPAddress",   ipAddress);
                    var result = _db.ExecuteScalar("Account_ChangeCandidateMobileNo", p)?.ToString() ?? "";
                    if (result.ToUpper() == "Y") mobileMsg = "Mobile Number Changed Successfully.";
                    else return new ChangeMobileEmailResponse { Success = false, Message = result.Length > 0 ? result : "Failed to change mobile number." };
                }

                // ── Change E-Mail ID ──────────────────────────────────────────
                if (!string.IsNullOrWhiteSpace(newEmail))
                {
                    var dupP = new DynamicParameters();
                    dupP.Add("@CandidateID", cid);
                    dupP.Add("@EMailID",     newEmail.Trim().ToLower());
                    var dup = _db.ExecuteScalar("ApplicationForm_IsApplicationFormAlreadyRegisteredUsingThisEMailID", dupP);
                    if (dup != null && Convert.ToBoolean(dup))
                        return new ChangeMobileEmailResponse { Success = false, Message = $"E-Mail ID {newEmail} is already registered. Please use a different e-mail address." };

                    var p = new DynamicParameters();
                    p.Add("@CandidateID", cid);
                    p.Add("@EMailID",     newEmail.Trim().ToLower());
                    p.Add("@UserLoginID", adminLoginId);
                    p.Add("@IPAddress",   ipAddress);
                    var result = _db.ExecuteScalar("Account_ChangeCandidateEMailID", p)?.ToString() ?? "";
                    if (result.ToUpper() == "Y") emailMsg = "E-Mail ID Changed Successfully.";
                    else return new ChangeMobileEmailResponse { Success = false, Message = result.Length > 0 ? result : "Failed to change E-Mail ID." };
                }

                var msg = string.Join(" ", new[] { mobileMsg, emailMsg }.Where(m => m.Length > 0));
                return new ChangeMobileEmailResponse { Success = true, Message = msg.Length > 0 ? msg : "Changes saved successfully." };
            }
            catch (Exception ex)
            {
                return new ChangeMobileEmailResponse { Success = false, Message = ex.Message };
            }
        }

        // ── Get Security Question Details (Admin) ─────────────────────────────
        // Mirrors ChangeSecurityQuestion.aspx Page_Load → LoadMasters + GetSecurityQuestion
        // Returns security question list + current selection for the candidate
        public AdminSecurityQuestionResponse GetSecurityQuestionDetails(string applicationId)
        {
            var r = new AdminSecurityQuestionResponse();
            try
            {
                // Resolve CandidateID (UserID) from ApplicationID
                var idP = new DynamicParameters();
                idP.Add("@ApplicationID", applicationId.Trim());
                var candidateId = _db.ExecuteScalar("Base_GetCandidateID", idP);
                if (candidateId == null || Convert.ToInt64(candidateId) == 0)
                { r.Success = false; r.Message = "Invalid Application ID."; return r; }

                long uid = Convert.ToInt64(candidateId);

                // Load security question master list
                var mp = new DynamicParameters();
                mp.Add("@TableName",        "Master_SecurityQuestion");
                mp.Add("@DataValueField",   "SecurityQuestionID");
                mp.Add("@DataTextField",    "SecurityQuestion");
                mp.Add("@ParentField",      "");
                mp.Add("@ParentFieldValue", "");
                mp.Add("@OrderByFields",    "SecurityQuestion");
                var dt = _db.GetDataTable("Base_GetMasterTableList", mp);
                if (dt != null)
                    foreach (System.Data.DataRow row in dt.Rows)
                        r.SecurityQuestions.Add(new SecurityQuestionItem
                        {
                            Value = row[0]?.ToString() ?? "",
                            Text  = row[1]?.ToString() ?? ""
                        });

                // Get current security question for this candidate
                var p = new DynamicParameters();
                p.Add("@UserID", uid);
                var dt2 = _db.GetDataTable("Account_GetSecurityQuestionDetails", p);
                if (dt2 != null && dt2.Rows.Count > 0)
                {
                    r.CurrentSecurityQuestionID     = Convert.ToInt32(dt2.Rows[0]["SecurityQuestionID"]);
                    r.CurrentSecurityQuestionAnswer = dt2.Rows[0]["SecurityQuestionAnswer"]?.ToString() ?? "";
                }

                r.CandidateId = uid;
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── Change Security Question (Admin override) ─────────────────────────
        // Mirrors ChangeSecurityQuestion.aspx btnChangeSecurityQuestion_Click
        // SP: Account_ResetSecurityQuestion(@UserID, @SecurityQuestionID, @SecurityQuestionAnswer, @UserLoginID, @IPAddress)
        public ChangeMobileEmailResponse ChangeSecurityQuestion(
            string applicationId, int securityQuestionId, string answer,
            string adminLoginId, string ipAddress)
        {
            try
            {
                // Resolve CandidateID
                var idP = new DynamicParameters();
                idP.Add("@ApplicationID", applicationId.Trim());
                var candidateId = _db.ExecuteScalar("Base_GetCandidateID", idP);
                if (candidateId == null || Convert.ToInt64(candidateId) == 0)
                    return new ChangeMobileEmailResponse { Success = false, Message = "Invalid Application ID." };

                long uid = Convert.ToInt64(candidateId);

                var p = new DynamicParameters();
                p.Add("@UserID",                 uid);
                p.Add("@SecurityQuestionID",      securityQuestionId);
                p.Add("@SecurityQuestionAnswer",  answer.Trim());
                p.Add("@UserLoginID",             adminLoginId);
                p.Add("@IPAddress",               ipAddress);
                var result = _db.ExecuteScalar("Account_ResetSecurityQuestion", p)?.ToString() ?? "";
                bool ok = result.ToUpper() == "Y";
                return new ChangeMobileEmailResponse
                {
                    Success = ok,
                    Message = ok ? "Security Question Changed Successfully." : (result.Length > 0 ? result : "Failed to change security question.")
                };
            }
            catch (Exception ex) { return new ChangeMobileEmailResponse { Success = false, Message = ex.Message }; }
        }
    }
}
