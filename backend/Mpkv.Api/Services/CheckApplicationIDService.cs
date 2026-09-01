using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.College;

namespace Mpkv.Api.Services
{
    public interface ICheckApplicationIDService
    {
        CheckApplicationIDResponse Search(
            string applicationId, short phaseId,
            string flag, int userTypeId, string userLoginId);
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
    }
}
