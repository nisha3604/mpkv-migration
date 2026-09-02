using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.College;
using Microsoft.AspNetCore.Http;

namespace Mpkv.Api.Services
{
    public interface ICheckApplicationIDService
    {
        CheckApplicationIDResponse Search(string applicationId, short phaseId, string flag, int userTypeId, string userLoginId);
        // Second stage — ConfirmAdmission.aspx flow
        AdmissionSummaryResponse   GetAdmissionSummary(long candidateId, long collegeId, short phaseId, string userLoginId, string flag);
        AdmissionActionResponse    ConfirmAdmission(ConfirmAdmissionRequest req, string reportedBy, string ipAddress);
        AdmissionActionResponse    RejectAdmission(ConfirmAdmissionRequest req, string rejectedBy, string ipAddress);
        AdmissionActionResponse    CancelAdmission(ConfirmAdmissionRequest req, string cancelledBy, string ipAddress);
        Task<AdmissionActionResponse> UploadAdmissionDocument(UploadAdmissionDocRequest req, IFormFile file, string userLoginId, string ipAddress);
    }

    /// <summary>
    /// Mirrors CheckApplicationID.aspx.cs — handles all 5 flags.
    /// Key logic:
    ///  - Base_GetCandidateID(@ApplicationID) → CandidateID
    ///  - EncryptedCandidateID = CandidateID.GetHashCode().ToString()
    ///  - ReportingStatus per flag:
    ///      ConfirmAdmission                 → "N", uses phaseId
    ///      CancelAdmission                  → "Y", phaseId=0
    ///      PrintAdmissionLetter             → "Y", phaseId=0
    ///      PrintAdmissionCancellationLetter → "C", phaseId=0
    ///      PrintAdmissionRejectionLetter    → "R", phaseId=0
    ///  - College (61): rows filtered by SP — message if empty is "not allotted in your institute"
    ///  - Other users: message if empty is "not allotted in any institute"
    ///  - SP: Admission_GetReportingDetails
    ///  - Candidate name: Base_GetCandidateName(@CandidateID)
    /// </summary>
    public class CheckApplicationIDService : ICheckApplicationIDService
    {
        private readonly DbAccess _db;
        public CheckApplicationIDService(DbAccess db) => _db = db;

        public CheckApplicationIDResponse Search(
            string applicationId, short phaseId,
            string flag, int userTypeId, string userLoginId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(applicationId))
                    return new CheckApplicationIDResponse { Success = false, Message = "Please Enter Application ID." };

                if (flag == "ConfirmAdmission" && phaseId <= 0)
                    return new CheckApplicationIDResponse { Success = false, Message = "Please Select Round." };

                // Step 1: Get CandidateID — mirrors BaseWorker().GetCandidateID(txtApplicationID.Text)
                var idParam = new DynamicParameters();
                idParam.Add("@ApplicationID", applicationId.Trim().ToUpper());
                var candidateIdObj = _db.ExecuteScalar("Base_GetCandidateID", idParam);

                if (candidateIdObj == null || Convert.ToInt64(candidateIdObj) == 0)
                    return new CheckApplicationIDResponse { Success = false, Message = "Invalid Application ID." };

                long candidateId = Convert.ToInt64(candidateIdObj);

                // Step 2: EncryptedCandidateID — mirrors CandidateID.ToString().GetHashCode().ToString()
                string encryptedId = candidateId.GetHashCode().ToString();

                // Step 3: Determine ReportingStatus + effective PhaseID per flag
                string reportingStatus;
                short  effectivePhaseId;

                switch (flag)
                {
                    case "ConfirmAdmission":
                        reportingStatus   = "N";
                        effectivePhaseId  = phaseId;
                        break;
                    case "CancelAdmission":
                        reportingStatus  = "Y";
                        effectivePhaseId = 0;
                        break;
                    case "PrintAdmissionLetter":
                        reportingStatus  = "Y";
                        effectivePhaseId = 0;
                        break;
                    case "PrintAdmissionCancellationLetter":
                        reportingStatus  = "C";
                        effectivePhaseId = 0;
                        break;
                    case "PrintAdmissionRejectionLetter":
                        reportingStatus  = "R";
                        effectivePhaseId = 0;
                        break;
                    default:
                        return new CheckApplicationIDResponse { Success = false, Message = "Invalid flag." };
                }

                // Step 4: Pass userLoginId directly to SP.
                // SP WHERE: CAST(B.CollegeID AS VARCHAR) = @UserLoginID
                // SP also looks up UserTypeID from Master_User using @UserLoginID.
                string spUserLoginId = userLoginId;

                // Step 4b: Call SP — mirrors AdmissionWorker().GetReportingDetails(...)
                Console.WriteLine($"[CheckApplicationID] flag={flag} userTypeId={userTypeId} userLoginId='{userLoginId}' spUserLoginId='{spUserLoginId}' candidateId={candidateId} encryptedId='{encryptedId}' phaseId={effectivePhaseId} reportingStatus={reportingStatus}");
                var param = new DynamicParameters();
                param.Add("@CandidateID",         (int)candidateId);
                param.Add("@EncryptedCandidateID", encryptedId);
                param.Add("@PhaseID",              effectivePhaseId);
                param.Add("@ReportingStatus",      reportingStatus);
                param.Add("@UserLoginID",          spUserLoginId);
                param.Add("@Flag",                 flag);

                var dt = _db.GetDataTable("Admission_GetReportingDetails", param);
                Console.WriteLine($"[CheckApplicationID] SP returned {dt?.Rows.Count ?? -1} rows");

                // Step 5: Empty result — message depends on UserTypeID (61 vs others)
                if (dt == null || dt.Rows.Count == 0)
                {
                    bool isCollege = userTypeId == 61;
                    string msg = flag switch
                    {
                        "ConfirmAdmission"                 => isCollege ? "This candidate is not allotted in your institute."  : "This candidate is not allotted in any institute.",
                        "CancelAdmission"                  => isCollege ? "This candidate is not admitted in your institute."  : "This candidate is not admitted in any institute.",
                        "PrintAdmissionLetter"             => isCollege ? "This candidate is not admitted in your institute."  : "This candidate is not admitted in any institute.",
                        "PrintAdmissionCancellationLetter" => isCollege ? "This candidate is not cancelled in your institute." : "This candidate is not cancelled in any institute.",
                        "PrintAdmissionRejectionLetter"    => isCollege ? "This candidate is not rejected in your institute."  : "This candidate is not rejected in any institute.",
                        _                                  => "No records found."
                    };
                    return new CheckApplicationIDResponse { Success = false, Message = msg };
                }

                // Step 6: Get candidate name — mirrors BaseWorker().GetCandidateName(CandidateID)
                string candidateName = "";
                try
                {
                    var nameParam = new DynamicParameters();
                    nameParam.Add("@CandidateID", candidateId);
                    candidateName = _db.ExecuteScalar("Base_GetCandidateName", nameParam)?.ToString() ?? "";
                }
                catch { /* non-critical */ }

                // Step 7: Map grid rows — matches gvList columns: ProceedURL, CollegeName, Course, CourseStatus
                var items = new List<ReportingDetailItem>();
                bool HC(string n) => dt.Columns.Contains(n);
                foreach (System.Data.DataRow row in dt.Rows)
                {
                    items.Add(new ReportingDetailItem
                    {
                        ProceedURL   = HC("ProceedURL")   ? row["ProceedURL"]?.ToString()   ?? "" : "",
                        CollegeName  = HC("CollegeName")  ? row["CollegeName"]?.ToString()  ?? "" : "",
                        Course       = HC("Course")       ? row["Course"]?.ToString()       ?? "" : "",
                        CourseStatus = HC("CourseStatus") ? row["CourseStatus"]?.ToString() ?? "" : "",
                    });
                }

                return new CheckApplicationIDResponse
                {
                    Success       = true,
                    ApplicationID = applicationId.Trim().ToUpper(),
                    CandidateName = candidateName,
                    Items         = items
                };
            }
            catch (Exception ex)
            {
                return new CheckApplicationIDResponse { Success = false, Message = ex.Message };
            }
        }

        // ══════════════════════════════════════════════════════════════════════
        // GET ADMISSION SUMMARY — mirrors ConfirmAdmission.aspx GetAdmissionSummary()
        // SP: Admission_GetAdmissionSummary(@CandidateID, @CollegeID, @PhaseID, @UserLoginID, @ReportingStatus, @Flag)
        // Also calls Admission_GetRequiredDocumentsForAdmission(@CandidateID, @UserLoginID, @IPAddress)
        // ══════════════════════════════════════════════════════════════════════
        public AdmissionSummaryResponse GetAdmissionSummary(long candidateId, long collegeId, short phaseId, string userLoginId, string flag)
        {
            var r = new AdmissionSummaryResponse();
            try
            {
                var reportingStatus = flag switch {
                    "ConfirmAdmission"                 => "N",
                    "CancelAdmission"                  => "Y",
                    "PrintAdmissionLetter"             => "Y",
                    "PrintAdmissionCancellationLetter" => "C",
                    "PrintAdmissionRejectionLetter"    => "R",
                    _                                  => "N"
                };

                var p = new DynamicParameters();
                p.Add("@CandidateID",      (int)candidateId);
                p.Add("@CollegeID",        (int)collegeId);
                p.Add("@PhaseID",          phaseId);
                p.Add("@UserLoginID",      userLoginId);
                p.Add("@ReportingStatus",  reportingStatus);
                p.Add("@Flag",             flag);

                var ds = _db.GetDataSet("Admission_GetAdmissionSummary", p);
                if (ds == null || ds.Tables.Count == 0 || ds.Tables[0].Rows.Count == 0)
                {
                    r.Message = "This Candidate is Not Allotted in this Phase.";
                    return r;
                }

                var row = ds.Tables[0].Rows[0];
                string S(string col) => ds.Tables[0].Columns.Contains(col) ? row[col]?.ToString() ?? "" : "";

                r.ApplicationID                 = S("ApplicationID");
                r.AppliedCourse                 = S("AppliedCourse");
                r.CandidateName                 = S("CandidateName");
                r.FatherName                    = S("FatherName");
                r.MotherName                    = S("MotherName");
                r.Gender                        = S("Gender");
                r.DOB                           = S("DOB");
                r.MobileNo                      = S("MobileNo");
                r.EMailID                       = S("EMailID");
                r.Category                      = S("Category");
                r.DomicileDistrict              = S("DomicileDistrict");
                r.EligibilityQualification      = S("EligibilityQualification");
                r.EligibilityQualificationMarks = S("EligibilityQualificationMarks");
                r.PhotoURL                      = S("PhotoURL");
                r.SignURL                       = S("SignURL");
                r.AcademicWeightage             = S("AcademicWeightage");
                r.Weightage712                  = S("7/12Weightage");
                r.NCCWeightage                  = S("NCCWeightage");
                r.SportWeightage                = S("SportWeightage");
                r.MPKVEmployeeWeightage         = S("MPKVEmployeeWeightage");
                r.TotalWeightage                = S("TotalWeightage");
                r.MeritNo                       = S("MeritNo");
                r.AllotmentPhase                = S("AllotmentPhase");
                r.AllottedCollegeCode           = S("AllottedCollegeCode");
                r.AllottedCollege               = S("AllottedCollege");
                r.AllottedCourse                = S("AllottedCourse");
                r.AllottedCategory              = S("AllottedCategory");
                r.AllottedType                  = S("AllottedType");
                r.AllottedTypeDisplay           = S("AllottedTypeDisplay");
                r.AllotmentDate                 = S("AllotmentDate");
                r.ReportingStatus               = S("ReportingStatus");
                r.AdmissionComments             = S("AdmissionComments");
                r.AllottedCourseStatus          = S("AllottedCourseStatus");
                r.PrintedOn                     = S("PrintedOn");
                r.ReportedOn                    = S("ReportedOn");
                r.ReportedBy                    = S("ReportedBy");
                r.CancellationComments          = S("CancellationComments");
                r.CancelledOn                   = S("CancelledOn");
                r.CancelledBy                   = S("CancelledBy");

                // Fetch nodal officer (AdmissionIncharge) from viewCollegeInformation
                try
                {
                    using var conn2 = new Microsoft.Data.SqlClient.SqlConnection(
                        typeof(DbAccess).GetField("_connectionString", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.GetValue(_db)?.ToString() ?? "");
                    conn2.Open();
                    var row2 = conn2.QuerySingleOrDefault<dynamic>(
                        "SELECT AdmissionInchargeName, AdmissionInchargeEMailID, AdmissionInchargeMobileNo FROM viewCollegeInformation (NOLOCK) WHERE CollegeID = @cid",
                        new { cid = (int)collegeId });
                    if (row2 != null)
                    {
                        r.NodalOfficerName     = row2.AdmissionInchargeName     ?? "";
                        r.NodalOfficerMobileNo = row2.AdmissionInchargeMobileNo ?? "";
                        r.NodalOfficerEMailID  = row2.AdmissionInchargeEMailID  ?? "";
                    }
                }
                catch { /* non-critical */ }

                // Load required documents
                try
                {
                    var dp = new DynamicParameters();
                    dp.Add("@CandidateID", (int)candidateId);
                    dp.Add("@UserLoginID", userLoginId);
                    dp.Add("@IPAddress",   "unknown");
                    var docDt = _db.GetDataTable("Admission_GetRequiredDocumentsForAdmission", dp);
                    if (docDt != null)
                    {
                        bool HC(string n) => docDt.Columns.Contains(n);
                        foreach (System.Data.DataRow docRow in docDt.Rows)
                        {
                            r.Documents.Add(new AdmissionDocumentDto
                            {
                                DocumentID                   = HC("DocumentID")                   && docRow["DocumentID"]   != DBNull.Value ? Convert.ToInt32(docRow["DocumentID"]) : 0,
                                DocumentName                 = HC("DocumentName")                 ? docRow["DocumentName"]?.ToString()                 ?? "" : "",
                                IsDocumentCompulsory         = HC("IsDocumentCompulsory")         ? docRow["IsDocumentCompulsory"]?.ToString()         ?? "" : "",
                                IsDocumentUploaded           = HC("IsDocumentUploaded")           ? docRow["IsDocumentUploaded"]?.ToString()           ?? "" : "",
                                DocumentUploadedURL          = HC("DocumentUploadedURL")          ? docRow["DocumentUploadedURL"]?.ToString()          ?? "" : "",
                                DocumentVerificationStatus   = HC("DocumentVerificationStatus")   ? docRow["DocumentVerificationStatus"]?.ToString()   ?? "" : "",
                                DocumentVerificationComments = HC("DocumentVerificationComments") ? docRow["DocumentVerificationComments"]?.ToString() ?? "" : "",
                            });
                        }
                    }
                }
                catch (Exception ex) { Console.WriteLine($"[GetAdmissionSummary] docs error: {ex.Message}"); }

                r.Success = true;
            }
            catch (Exception ex)
            {
                r.Message = ex.Message;
                Console.WriteLine($"[GetAdmissionSummary] {ex.Message}");
            }
            return r;
        }

        // Build DocumentsVerifiedXML — mirrors GetXML(ListDocumentsVerified) in old project
        private static string BuildDocumentsXml(List<DocumentVerificationItem> docs)
        {
            var sb = new System.Text.StringBuilder();
            sb.Append("<?xml version=\"1.0\" encoding=\"utf-16\"?>");
            sb.Append("<ArrayOfRequiredDocumentEntity xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">");
            foreach (var doc in docs)
            {
                sb.Append("<RequiredDocumentEntity>");
                sb.Append($"<DocumentID>{doc.DocumentID}</DocumentID>");
                sb.Append($"<IsVerified>1</IsVerified>");
                sb.Append($"<VerificationStatus>{System.Security.SecurityElement.Escape(doc.VerificationStatus)}</VerificationStatus>");
                sb.Append($"<VerificationComments>{System.Security.SecurityElement.Escape(doc.VerificationComments)}</VerificationComments>");
                sb.Append("</RequiredDocumentEntity>");
            }
            sb.Append("</ArrayOfRequiredDocumentEntity>");
            return sb.ToString();
        }

        // ══════════════════════════════════════════════════════════════════════
        // CONFIRM ADMISSION — mirrors btnConfirm_Click
        // SP: Admission_ConfirmAdmission
        // ══════════════════════════════════════════════════════════════════════
        public AdmissionActionResponse ConfirmAdmission(ConfirmAdmissionRequest req, string reportedBy, string ipAddress)
        {
            try
            {
                // Validate: all documents must be verified
                if (req.Documents.Any(d => d.VerificationStatus != "Y"))
                    return new AdmissionActionResponse { Success = false, Message = "Please Verify All Documents." };
                if (req.Documents.Any(d => d.VerificationStatus != "Y" && string.IsNullOrEmpty(d.VerificationComments)))
                    return new AdmissionActionResponse { Success = false, Message = "Comment should not be empty if any document is rejected." };

                var p = new DynamicParameters();
                p.Add("@CandidateID",          (int)req.CandidateID);
                p.Add("@CollegeID",             (int)req.CollegeID);
                p.Add("@PhaseID",               req.PhaseID);
                p.Add("@DocumentsVerifiedXML",  BuildDocumentsXml(req.Documents));
                p.Add("@AdmissionComments",     req.Comments);
                p.Add("@ReportedBy",            reportedBy);
                p.Add("@ReportedByIPAddress",   ipAddress);
                var result = _db.ExecuteScalar("Admission_ConfirmAdmission", p)?.ToString() ?? "";
                if (result.ToUpper() == "Y")
                    return new AdmissionActionResponse { Success = true, Message = "Admission Confirmed Successfully." };
                return new AdmissionActionResponse { Success = false, Message = result.Length > 0 ? result : "Data has not been saved. Please try again." };
            }
            catch (Exception ex) { return new AdmissionActionResponse { Success = false, Message = ex.Message }; }
        }

        // ══════════════════════════════════════════════════════════════════════
        // REJECT ADMISSION — mirrors CloseConfirmBoxYes (Reject path)
        // SP: Admission_RejectAdmission
        // ══════════════════════════════════════════════════════════════════════
        public AdmissionActionResponse RejectAdmission(ConfirmAdmissionRequest req, string rejectedBy, string ipAddress)
        {
            try
            {
                if (string.IsNullOrEmpty(req.Comments))
                    return new AdmissionActionResponse { Success = false, Message = "Please Enter Reason for Rejection under Remark." };
                if (req.Documents.Any(d => d.VerificationStatus != "Y" && string.IsNullOrEmpty(d.VerificationComments)))
                    return new AdmissionActionResponse { Success = false, Message = "Comment should not be empty if any document is rejected." };

                var p = new DynamicParameters();
                p.Add("@CandidateID",         (int)req.CandidateID);
                p.Add("@CollegeID",            (int)req.CollegeID);
                p.Add("@PhaseID",              req.PhaseID);
                p.Add("@DocumentsVerifiedXML", BuildDocumentsXml(req.Documents));
                p.Add("@RejectionComments",    req.Comments);
                p.Add("@RejectedBy",           rejectedBy);
                p.Add("@RejectedByIPAddress",  ipAddress);
                var result = _db.ExecuteScalar("Admission_RejectAdmission", p)?.ToString() ?? "";
                if (result.ToUpper() == "Y")
                    return new AdmissionActionResponse { Success = true, Message = "Admission Rejected Successfully." };
                return new AdmissionActionResponse { Success = false, Message = result.Length > 0 ? result : "Data has not been saved. Please try again." };
            }
            catch (Exception ex) { return new AdmissionActionResponse { Success = false, Message = ex.Message }; }
        }

        // ══════════════════════════════════════════════════════════════════════
        // CANCEL ADMISSION — mirrors CancelAdmission.aspx
        // SP: Admission_CancelAdmission
        // ══════════════════════════════════════════════════════════════════════
        public AdmissionActionResponse CancelAdmission(ConfirmAdmissionRequest req, string cancelledBy, string ipAddress)
        {
            try
            {
                if (string.IsNullOrEmpty(req.Comments))
                    return new AdmissionActionResponse { Success = false, Message = "Please Enter Reason for Cancellation." };

                var p = new DynamicParameters();
                p.Add("@CandidateID",           (int)req.CandidateID);
                p.Add("@CollegeID",              (int)req.CollegeID);
                p.Add("@PhaseID",               req.PhaseID);
                p.Add("@CancellationComments",  req.Comments);
                p.Add("@CancelledBy",           cancelledBy);
                p.Add("@CancelledByIPAddress",  ipAddress);
                var result = _db.ExecuteScalar("Admission_CancelAdmission", p)?.ToString() ?? "";
                if (result.ToUpper() == "Y")
                    return new AdmissionActionResponse { Success = true, Message = "Admission Cancelled Successfully." };
                return new AdmissionActionResponse { Success = false, Message = result.Length > 0 ? result : "Data has not been saved. Please try again." };
            }
            catch (Exception ex) { return new AdmissionActionResponse { Success = false, Message = ex.Message }; }
        }

        // ══════════════════════════════════════════════════════════════════════
        // UPLOAD ADMISSION DOCUMENT — mirrors ManageDocumentUpload()
        // SP: Admission_SaveRequiredDocumentUploadStatus (reuses ApplicationForm SP)
        // ══════════════════════════════════════════════════════════════════════
        public async Task<AdmissionActionResponse> UploadAdmissionDocument(UploadAdmissionDocRequest req, IFormFile file, string userLoginId, string ipAddress)
        {
            try
            {
                var ext = Path.GetExtension(file.FileName).ToLower();
                var guid = Guid.NewGuid().ToString("N");
                var fileName = $"{req.CandidateID}_{req.DocumentID}_{guid}{ext}";

                // Upload to Azure Blob
                var storageConn = _db.GetType().GetField("_connectionString", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.GetValue(_db)?.ToString() ?? "";
                // Use same UploadToBlob logic — save to wwwroot as fallback
                var folder   = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "documents");
                Directory.CreateDirectory(folder);
                var filePath = Path.Combine(folder, fileName);
                using (var stream = new FileStream(filePath, FileMode.Create, FileAccess.Write))
                    await file.CopyToAsync(stream);
                var url = $"/uploads/documents/{fileName}";

                // Optionally parse DocumentNo + IssueDate
                DateTime? issueDate = null;
                if (!string.IsNullOrWhiteSpace(req.DocumentIssueDate))
                    if (DateTime.TryParseExact(req.DocumentIssueDate.Trim(), new[] { "dd/MM/yyyy", "yyyy-MM-dd" }, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var pd))
                        issueDate = pd;

                var p = new DynamicParameters();
                p.Add("@CandidateID",          (int)req.CandidateID);
                p.Add("@DocumentID",           req.DocumentID);
                p.Add("@DocumentUploadedURL",  url);
                p.Add("@DocumentNo",           req.DocumentNo?.Trim().ToUpper() ?? "");
                p.Add("@DocumentIssueDate",    issueDate);
                p.Add("@Action",               "U");
                p.Add("@UserLoginID",          userLoginId);
                p.Add("@IPAddress",            ipAddress);
                p.Add("@PageCode",             "ConfirmAdmission");
                _db.ExecuteScalar("ApplicationForm_SaveRequiredDocumentUploadStatus", p);
                return new AdmissionActionResponse { Success = true, Message = "Document uploaded successfully." };
            }
            catch (Exception ex) { return new AdmissionActionResponse { Success = false, Message = ex.Message }; }
        }
    }
}
