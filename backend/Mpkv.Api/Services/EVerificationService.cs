using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.EVerification;
using System.Text;
using System.Xml;

namespace Mpkv.Api.Services
{
    public interface IEVerificationService
    {
        EVDashboardResponse       GetDashboard(long evcUserId, string userLoginId, int userTypeId);
        EVCandidateListResponse   GetCandidateList(string applicationStatus, string userLoginId);
        EVCheckAppIDResponse      CheckApplicationID(string applicationId, string userLoginId);
        EVAllotResponse           AllotCandidate(long candidateId, long evcUserId, string userLoginId, string ipAddress);
        EVDocumentListResponse    GetDocuments(long candidateId, string userLoginId);
        EVSaveVerificationResponse SaveVerification(EVSaveVerificationRequest req, string userLoginId, string ipAddress);
        // Reports
        EVCWiseReportResponse     GetEVCWiseReport();
        EVCWiseCandidateListResponse GetEVCWiseCandidateList(long evcId, string flag);
        EVEligibleCandidatesResponse GetEligibleCandidates(string userLoginId, short courseId);
    }

    /// <summary>
    /// Mirrors EVerificationWorker.cs + Repository.EVerification.cs from the old project.
    ///
    /// SPs:
    ///   Dashboard_GetEVerificationDashboard(@UserID)
    ///   EV_GetCandidateListForEVerification(@ApplicationStatus, @UserLoginID)
    ///   EV_GetCandidateDetailsForEVerification(@CandidateID)
    ///   EV_AllotCandidateToEVC(@CandidateID, @EVCID, @UserLoginID, @IPAddress)
    ///   EV_IsCandidateAllottedThisEVC(@CandidateID, @UserLoginID)
    ///   EV_SaveDocumentsEVerificationStatus(@CandidateID, @DocumentsVerifiedXML, @UserLoginID, @IPAddress)
    ///   ApplicationForm_GetFormSummary — used for document list (same as candidate summary)
    ///   Base_GetCandidateID(@ApplicationID)
    ///   Base_IsApplicationFormLocked(@CandidateID) or ApplicationForm check
    /// </summary>
    public class EVerificationService : IEVerificationService
    {
        private readonly DbAccess _db;
        public EVerificationService(DbAccess db) => _db = db;

        // ── Dashboard ─────────────────────────────────────────────────────────
        public EVDashboardResponse GetDashboard(long evcUserId, string userLoginId, int userTypeId)
        {
            var r = new EVDashboardResponse
            {
                UserLoginID = userLoginId,
                UserType    = userTypeId == 41 ? "EVC Supervisor" : "EVC Coordinator",
                IsEVCSupervisor = userTypeId == 41,
                CurrentLoginDateTime = DateTime.Now.ToString("dd/MM/yyyy hh:mm:ss tt"),
            };
            try
            {
                // Get EVC user name
                var pn = new DynamicParameters(); pn.Add("@CandidateID", evcUserId);
                r.UserName = _db.ExecuteScalar("Base_GetCandidateName", pn)?.ToString() ?? userLoginId;

                // Get dashboard stats
                var p = new DynamicParameters(); p.Add("@UserID", evcUserId);
                var dt = _db.GetDataTable("Dashboard_GetEVerificationDashboard", p);
                if (dt != null && dt.Rows.Count > 0)
                {
                    var row = dt.Rows[0];
                    bool HC(string n) => dt.Columns.Contains(n) && row[n] != DBNull.Value;
                    r.Total             = HC("Total")             ? row["Total"]?.ToString()             ?? "0" : "0";
                    r.FullyVerified     = HC("FullyVerified")     ? row["FullyVerified"]?.ToString()     ?? "0" : "0";
                    r.PartiallyVerified = HC("PartiallyVerified") ? row["PartiallyVerified"]?.ToString() ?? "0" : "0";
                    r.NotAssigned       = HC("NotAssigned")       ? row["NotAssigned"]?.ToString()       ?? "0" : "0";
                    r.NotVerified       = HC("NotVerified")       ? row["NotVerified"]?.ToString()       ?? "0" : "0";
                    r.ReUploaded        = HC("ReUploaded")        ? row["ReUploaded"]?.ToString()        ?? "0" : "0";
                }
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── Candidate List ────────────────────────────────────────────────────
        public EVCandidateListResponse GetCandidateList(string applicationStatus, string userLoginId)
        {
            var r = new EVCandidateListResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@ApplicationStatus", applicationStatus);
                p.Add("@UserLoginID",       userLoginId);
                var ds = _db.GetDataSet("EV_GetCandidateListForEVerification", p);
                if (ds != null && ds.Tables.Count > 0)
                {
                    var dt = ds.Tables[0];
                    bool HC(string n) => dt.Columns.Contains(n);
                    foreach (System.Data.DataRow row in dt.Rows)
                        r.Items.Add(new EVCandidateItem
                        {
                            CandidateID   = HC("CandidateID") && row["CandidateID"] != DBNull.Value ? Convert.ToInt64(row["CandidateID"]) : 0,
                            ApplicationID = HC("ApplicationID") ? row["ApplicationID"]?.ToString() ?? "" : "",
                            CandidateName = HC("CandidateName") ? row["CandidateName"]?.ToString() ?? "" : "",
                            Course        = HC("AppliedCourse") ? row["AppliedCourse"]?.ToString() ?? "" : (HC("Course") ? row["Course"]?.ToString() ?? "" : ""),
                            MobileNo      = HC("MobileNo")      ? row["MobileNo"]?.ToString()      ?? "" : "",
                            // Status is derived from IsNotVerified/IsPartiallyVerified/IsRejected/IsFullyVerified flags
                            Status        = HC("IsFullyVerified") && Convert.ToBoolean(row["IsFullyVerified"]) ? "F"
                                          : HC("IsRejected")      && Convert.ToBoolean(row["IsRejected"])      ? "R"
                                          : HC("IsPartiallyVerified") && Convert.ToBoolean(row["IsPartiallyVerified"]) && HC("IsNotVerified") && !Convert.ToBoolean(row["IsNotVerified"]) ? "P"
                                          : "N",
                        });
                }
                r.Success = true;
                if (r.Items.Count == 0) r.Message = "No records found.";
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── Check Application ID ──────────────────────────────────────────────
        public EVCheckAppIDResponse CheckApplicationID(string applicationId, string userLoginId)
        {
            var r = new EVCheckAppIDResponse();
            try
            {
                // Resolve ApplicationID → CandidateID
                var p1 = new DynamicParameters(); p1.Add("@ApplicationID", applicationId.Trim().ToUpper());
                var idObj = _db.ExecuteScalar("Base_GetCandidateID", p1);
                if (idObj == null || Convert.ToInt64(idObj) == 0)
                    return new EVCheckAppIDResponse { Success = false, Message = "Invalid Application ID." };

                r.CandidateID   = Convert.ToInt64(idObj);
                r.ApplicationID = applicationId.Trim().ToUpper();

                // Get candidate details
                var p2 = new DynamicParameters(); p2.Add("@CandidateID", r.CandidateID);
                var ds = _db.GetDataSet("EV_GetCandidateDetailsForEVerification", p2);
                if (ds != null && ds.Tables.Count > 0 && ds.Tables[0].Rows.Count > 0)
                {
                    var row = ds.Tables[0].Rows[0];
                    var dt  = ds.Tables[0];
                    bool HC(string n) => dt.Columns.Contains(n) && row[n] != DBNull.Value;
                    r.CandidateName = HC("CandidateName") ? row["CandidateName"]?.ToString() ?? "" : "";
                    r.Course        = HC("Course")        ? row["Course"]?.ToString()        ?? "" : "";
                    r.MobileNo      = HC("MobileNo")      ? row["MobileNo"]?.ToString()      ?? "" : "";
                }

                // Check form locked
                var p3 = new DynamicParameters(); p3.Add("@CandidateID", r.CandidateID);
                var locked = _db.ExecuteScalar("Base_IsApplicationFormLocked", p3);
                r.IsFormLocked = locked != null && Convert.ToBoolean(locked);

                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── Allot Candidate to EVC ────────────────────────────────────────────
        public EVAllotResponse AllotCandidate(long candidateId, long evcUserId, string userLoginId, string ipAddress)
        {
            try
            {
                // evcUserId from JWT = UserID in Master_User
                // EVCID in Master_EVC = UserID in Master_User (they are the same value)
                // So pass evcUserId directly as @EVCID
                var p = new DynamicParameters();
                p.Add("@CandidateID", candidateId);
                p.Add("@EVCID",       evcUserId);
                p.Add("@UserLoginID", userLoginId);
                p.Add("@IPAddress",   ipAddress);
                var result = _db.ExecuteScalar("EV_AllotCandidateToEVC", p)?.ToString() ?? "";
                bool ok = result.ToUpper() == "Y";
                return new EVAllotResponse
                {
                    Success     = ok,
                    CandidateID = candidateId,
                    Message     = ok ? "Candidate allotted successfully." : (result.Length > 0 ? result : "Failed to allot candidate.")
                };
            }
            catch (Exception ex) { return new EVAllotResponse { Success = false, Message = ex.Message }; }
        }

        // ── Get Document List ─────────────────────────────────────────────────
        public EVDocumentListResponse GetDocuments(long candidateId, string userLoginId)
        {
            var r = new EVDocumentListResponse { CandidateID = candidateId };
            try
            {
                // Get application summary via ApplicationForm_GetFormSummary (same as candidate summary)
                var p = new DynamicParameters();
                p.Add("@CandidateID", candidateId);
                p.Add("@UserLoginID", userLoginId);
                p.Add("@PageCode",    "EVerifyDocuments");
                var ds = _db.GetDataSet("ApplicationForm_GetFormSummary", p);
                if (ds == null) { r.Success = false; r.Message = "Could not load candidate data."; return r; }

                bool HasTable(int i) => ds.Tables.Count > i && ds.Tables[i].Rows.Count > 0;

                // Table 1 — Personal (get name, appID)
                if (HasTable(1))
                {
                    var row = ds.Tables[1].Rows[0];
                    bool HC1(string n) => ds.Tables[1].Columns.Contains(n) && row[n] != DBNull.Value;
                    r.CandidateName = HC1("CandidateName") ? row["CandidateName"]?.ToString() ?? "" : "";
                    r.ApplicationID = HC1("ApplicationID") ? row["ApplicationID"]?.ToString() ?? "" : "";
                }

                // Table 7 — Photo & Sign
                if (HasTable(7))
                {
                    var row = ds.Tables[7].Rows[0];
                    bool HC7(string n) => ds.Tables[7].Columns.Contains(n) && row[n] != DBNull.Value;
                    r.PhotoURL = HC7("PhotoUploadedURL") ? row["PhotoUploadedURL"]?.ToString() ?? "" : "";
                    r.SignURL  = HC7("SignUploadedURL")  ? row["SignUploadedURL"]?.ToString()  ?? "" : "";
                }

                // Table 8 — Documents
                if (HasTable(8))
                {
                    var dt = ds.Tables[8];
                    bool HC(string n) => dt.Columns.Contains(n);
                    foreach (System.Data.DataRow row in dt.Rows)
                        r.Documents.Add(new EVDocumentItem
                        {
                            DocumentID                 = HC("DocumentID") && row["DocumentID"] != DBNull.Value ? Convert.ToInt32(row["DocumentID"]) : 0,
                            DocumentName               = HC("DocumentName")               ? row["DocumentName"]?.ToString()               ?? "" : "",
                            IsDocumentCompulsory       = HC("IsDocumentCompulsory")       ? row["IsDocumentCompulsory"]?.ToString()       ?? "" : "",
                            IsDocumentUploaded         = HC("IsDocumentUploaded")         ? row["IsDocumentUploaded"]?.ToString()         ?? "" : "",
                            DocumentUploadedURL        = HC("DocumentUploadedURL")        ? row["DocumentUploadedURL"]?.ToString()        ?? "" : "",
                            DocumentVerificationStatus = HC("DocumentVerificationStatus") ? row["DocumentVerificationStatus"]?.ToString() ?? "" : "",
                            VerificationComments       = HC("DocumentVerificationComments") ? row["DocumentVerificationComments"]?.ToString() ?? "" : "",
                        });
                }

                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── Save Verification ─────────────────────────────────────────────────
        public EVSaveVerificationResponse SaveVerification(EVSaveVerificationRequest req, string userLoginId, string ipAddress)
        {
            try
            {
                if (req == null || req.Documents == null || req.Documents.Count == 0)
                    return new EVSaveVerificationResponse { Success = false, Message = "No documents to verify." };

                // Validate — all uploaded docs must have a comment if rejected
                foreach (var doc in req.Documents)
                    if (doc.VerificationStatus == "N" && string.IsNullOrWhiteSpace(doc.VerificationComments))
                        return new EVSaveVerificationResponse { Success = false, Message = "Please enter comments for all rejected documents." };

                // Build XML matching old project's GetXML(List<RequiredDocumentEntity>)
                var xml = BuildDocumentXml(req.Documents);

                var p = new DynamicParameters();
                p.Add("@CandidateID",          req.CandidateID);
                p.Add("@DocumentsVerifiedXML",  xml);
                p.Add("@UserLoginID",           userLoginId);
                p.Add("@IPAddress",             ipAddress);

                var result = _db.ExecuteScalar("EV_SaveDocumentsEVerificationStatus", p)?.ToString() ?? "";
                bool ok = result.ToUpper() == "Y";
                return new EVSaveVerificationResponse
                {
                    Success = ok,
                    Message = ok ? "Document verification saved successfully." : (result.Length > 0 ? result : "Failed to save. Please try again.")
                };
            }
            catch (Exception ex) { return new EVSaveVerificationResponse { Success = false, Message = ex.Message }; }
        }

        // ── EVC Wise Report ───────────────────────────────────────────────────
        public EVCWiseReportResponse GetEVCWiseReport()
        {
            var r = new EVCWiseReportResponse();
            try
            {
                var ds = _db.GetDataSet("Report_GetEVCWiseReport");
                if (ds != null && ds.Tables.Count > 0)
                {
                    var dt = ds.Tables[0];
                    bool HC(System.Data.DataRow row, string n) => dt.Columns.Contains(n) && row[n] != DBNull.Value;
                    string S(System.Data.DataRow row, string n) => HC(row, n) ? row[n]?.ToString() ?? "0" : "0";
                    foreach (System.Data.DataRow row in dt.Rows)
                        r.Items.Add(new EVCWiseReportItem
                        {
                            EVCID                  = HC(row,"EVCID") ? Convert.ToInt64(row["EVCID"]) : 0,
                            EVCCode                = HC(row,"EVCCode") ? row["EVCCode"]?.ToString() ?? "" : "",
                            TotalForms             = S(row,"TotalForms"),
                            NotVerifiedForms       = S(row,"NotVerifiedForms"),
                            ReUploadedForms        = S(row,"ReUploadedForms"),
                            PartiallyVerifiedForms = S(row,"PartiallyVerifiedForms"),
                            FullyVerifiedForms     = S(row,"FullyVerifiedForms"),
                        });
                }
                if (ds != null && ds.Tables.Count > 1 && ds.Tables[1].Rows.Count > 0)
                {
                    var row = ds.Tables[1].Rows[0];
                    var dt  = ds.Tables[1];
                    string S2(string n) => dt.Columns.Contains(n) && row[n] != DBNull.Value ? row[n]?.ToString() ?? "0" : "0";
                    r.Totals = new EVCWiseReportTotals
                    {
                        TotalForms             = S2("TotalForms"),
                        NotVerifiedForms       = S2("NotVerifiedForms"),
                        ReUploadedForms        = S2("ReUploadedForms"),
                        PartiallyVerifiedForms = S2("PartiallyVerifiedForms"),
                        FullyVerifiedForms     = S2("FullyVerifiedForms"),
                    };
                }
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── EVC Wise Candidate List ───────────────────────────────────────────
        public EVCWiseCandidateListResponse GetEVCWiseCandidateList(long evcId, string flag)
        {
            var r = new EVCWiseCandidateListResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@EVCID", evcId);
                p.Add("@Flag",  flag);
                var dt = _db.GetDataTable("Report_GetEVCWiseCandidateList", p);
                bool HC(System.Data.DataRow row, string n) => dt.Columns.Contains(n) && row[n] != DBNull.Value;
                if (dt != null)
                    foreach (System.Data.DataRow row in dt.Rows)
                        r.Items.Add(new EVCWiseCandidateItem
                        {
                            AppliedCourse      = HC(row,"AppliedCourse")      ? row["AppliedCourse"]?.ToString()      ?? "" : "",
                            ApplicationID      = HC(row,"ApplicationID")      ? row["ApplicationID"]?.ToString()      ?? "" : "",
                            CandidateName      = HC(row,"CandidateName")      ? row["CandidateName"]?.ToString()      ?? "" : "",
                            Category           = HC(row,"Category")           ? row["Category"]?.ToString()           ?? "" : "",
                            VerificationStatus = HC(row,"VerificationStatus") ? row["VerificationStatus"]?.ToString() ?? "" : "",
                        });
                r.Success = true;
                if (r.Items.Count == 0) r.Message = "No records found.";
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── Eligible Candidates for EVerification ─────────────────────────────
        public EVEligibleCandidatesResponse GetEligibleCandidates(string userLoginId, short courseId)
        {
            var r = new EVEligibleCandidatesResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@UserLoginID", userLoginId);
                p.Add("@CourseID",    courseId);
                var ds = _db.GetDataSet("Report_GetCandidatesEligibleForEverification", p);
                if (ds != null && ds.Tables.Count > 0)
                {
                    var dt = ds.Tables[0];
                    bool HC(System.Data.DataRow row, string n) => dt.Columns.Contains(n) && row[n] != DBNull.Value;
                    foreach (System.Data.DataRow row in dt.Rows)
                        r.Items.Add(new EVEligibleCandidateItem
                        {
                            AppliedCourse      = HC(row,"AppliedCourse")      ? row["AppliedCourse"]?.ToString()      ?? "" : "",
                            ApplicationID      = HC(row,"ApplicationID")      ? row["ApplicationID"]?.ToString()      ?? "" : "",
                            CandidateName      = HC(row,"CandidateName")      ? row["CandidateName"]?.ToString()      ?? "" : "",
                            Category           = HC(row,"Category")           ? row["Category"]?.ToString()           ?? "" : "",
                            AssignedTo         = HC(row,"AssignedTo")         ? row["AssignedTo"]?.ToString()         ?? "" : "",
                            VerificationStatus = HC(row,"VerificationStatus") ? row["VerificationStatus"]?.ToString() ?? "" : "",
                        });
                }
                r.Success = true;
                if (r.Items.Count == 0) r.Message = "No records found.";
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── XML helper — mirrors GetXML(List<RequiredDocumentEntity>) ─────────
        private static string BuildDocumentXml(List<EVDocumentVerificationItem> docs)
        {
            var sb = new StringBuilder();
            sb.Append("<ArrayOfRequiredDocumentEntity xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\">");
            foreach (var d in docs)
            {
                sb.Append("<RequiredDocumentEntity>");
                sb.Append($"<DocumentID>{d.DocumentID}</DocumentID>");
                sb.Append($"<IsVerified>1</IsVerified>");
                sb.Append($"<VerificationStatus>{XmlEscape(d.VerificationStatus)}</VerificationStatus>");
                sb.Append($"<VerificationComments>{XmlEscape(d.VerificationComments)}</VerificationComments>");
                sb.Append("</RequiredDocumentEntity>");
            }
            sb.Append("</ArrayOfRequiredDocumentEntity>");
            return sb.ToString();
        }

        private static string XmlEscape(string? s)
            => s == null ? "" : s.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;").Replace("'", "&apos;");
    }
}
