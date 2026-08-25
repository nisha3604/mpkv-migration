using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.College;

namespace Mpkv.Api.Services
{
    public interface IAllotmentService
    {
        PhaseListResponse          GetPhaseList(int userTypeId, string userLoginId);
        AllotmentStatusResponse    GetAllotmentStatus(string applicationId, short phaseId, int userTypeId, string userLoginId);
        DownloadAllotmentLetterResponse SaveDownloadStatus(long candidateId, long collegeId, short phaseId, string userLoginId, string ipAddress);
        RefusalFeeInitiateResponse InitiateRefusalFee(long candidateId, int phaseId, short paymentGatewayId, string userLoginId, string ipAddress);
    }

    /// <summary>
    /// Mirrors CheckAllotmentStatus.aspx.cs logic exactly.
    /// </summary>
    public class AllotmentService : IAllotmentService
    {
        private readonly DbAccess _db;
        public AllotmentService(DbAccess db) => _db = db;

        // ══════════════════════════════════════════════════════════════════════
        // GetPhaseList
        // SP: Admission_GetPhaseList(@UserTypeID, @Flag, @UserLoginID)
        // Flag: UserTypeID=91 → "AllotmentDisplay", else → "AllotmentReport"
        // Also calls Admission_GetCurrentPhaseID to auto-select current phase
        // Mirrors: Page_Load ddlPhase binding
        // ══════════════════════════════════════════════════════════════════════
        public PhaseListResponse GetPhaseList(int userTypeId, string userLoginId)
        {
            var response = new PhaseListResponse();
            try
            {
                var flag = userTypeId == 91 ? "AllotmentDisplay" : "AllotmentReport";

                var param = new DynamicParameters();
                param.Add("@UserTypeID",  userTypeId);
                param.Add("@Flag",        flag);
                param.Add("@UserLoginID", userLoginId);

                var dt = _db.GetDataTable("Admission_GetPhaseList", param);
                if (dt != null)
                {
                    foreach (System.Data.DataRow row in dt.Rows)
                    {
                        var val = row[0]?.ToString() ?? "";
                        if (val == "-1") continue;
                        response.Phases.Add(new PhaseItem { Value = val, Text = row[1]?.ToString() ?? "" });
                    }
                }

                // Get current phase ID for auto-selection
                try
                {
                    var currentPhase = _db.ExecuteScalar("Admission_GetCurrentPhaseID");
                    response.CurrentPhaseID = currentPhase != null ? Convert.ToInt32(currentPhase) : 0;
                }
                catch { response.CurrentPhaseID = 0; }

                if (response.Phases.Count == 0)
                    response.Message = "Allotment is Not Published for Any Phase.";
                else
                    response.Success = true;
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Message = ex.Message;
            }
            return response;
        }

        // ══════════════════════════════════════════════════════════════════════
        // GetAllotmentStatus
        // Mirrors: CheckAllotment() method in CheckAllotmentStatus.aspx.cs
        //
        // Step 1: Base_GetCandidateID(@ApplicationID) → CandidateID
        // Step 2: Admission_GetCategoryConversionFeeDetails(@CandidateID) → check RemainingFee
        // Step 3: Admission_GetAllotmentStatus(@PhaseID, @CandidateID) → full details
        // Step 4: For college user (61): verify AllottedCollegeCode == userLoginId
        // ══════════════════════════════════════════════════════════════════════
        public AllotmentStatusResponse GetAllotmentStatus(string applicationId, short phaseId, int userTypeId, string userLoginId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(applicationId))
                    return new AllotmentStatusResponse { Success = false, Message = "Please Enter Application ID." };
                if (phaseId <= 0)
                    return new AllotmentStatusResponse { Success = false, Message = "Please Select Round." };

                // Step 1: Get CandidateID from ApplicationID
                var idParam = new DynamicParameters();
                idParam.Add("@ApplicationID", applicationId.Trim().ToUpper());
                var candidateIdObj = _db.ExecuteScalar("Base_GetCandidateID", idParam);
                if (candidateIdObj == null || Convert.ToInt64(candidateIdObj) == 0)
                    return new AllotmentStatusResponse { Success = false, Message = "Invalid Application ID." };
                long candidateId = Convert.ToInt64(candidateIdObj);

                // Step 2: Category conversion fee check
                try
                {
                    var feeParam = new DynamicParameters();
                    feeParam.Add("@CandidateID", candidateId);
                    var feeDt = _db.GetDataTable("Admission_GetCategoryConversionFeeDetails", feeParam);
                    if (feeDt != null && feeDt.Rows.Count > 0)
                    {
                        var feeRow = feeDt.Rows[0];
                        int remaining = feeDt.Columns.Contains("RemainingFee") && feeRow["RemainingFee"] != DBNull.Value
                            ? Convert.ToInt32(feeRow["RemainingFee"]) : 0;
                        if (remaining > 0)
                            return new AllotmentStatusResponse { Success = false, Message = "As you have not submitted valid documents for category, Your category is converted to GENERAL. You have to pay the category conversion fee before downloading the allotment letter." };
                    }
                }
                catch { /* non-critical */ }

                // Step 3: Get allotment status
                var param = new DynamicParameters();
                param.Add("@PhaseID",     phaseId);
                param.Add("@CandidateID", candidateId);
                var ds = _db.GetDataSet("Admission_GetAllotmentStatus", param);

                if (ds == null || ds.Tables.Count == 0 || ds.Tables[0].Rows.Count == 0)
                    return new AllotmentStatusResponse { Success = false, Message = "You are Not Allotted in this Phase." };

                var dr = ds.Tables[0].Rows[0];
                bool HC(string n) => ds.Tables[0].Columns.Contains(n);

                // Step 4: College restriction check (mirrors old code)
                var allottedCollegeCode = HC("AllottedCollegeCode") ? dr["AllottedCollegeCode"]?.ToString() ?? "" : "";
                if (userTypeId == 61 && userLoginId.Trim().ToUpper() != allottedCollegeCode.Trim().ToUpper())
                    return new AllotmentStatusResponse { Success = false, Message = "This Candidate is Not Allotted in Your College." };

                // Map all fields
                var dto = new AllotmentStatusDto
                {
                    AppliedCourse     = HC("AppliedCourse")  ? dr["AppliedCourse"]?.ToString()  ?? "" : "",
                    ApplicationID     = HC("ApplicationID")  ? dr["ApplicationID"]?.ToString()  ?? "" : "",
                    CandidateName     = HC("CandidateName")  ? dr["CandidateName"]?.ToString()  ?? "" : "",
                    Gender            = HC("Gender")          ? dr["Gender"]?.ToString()          ?? "" : "",
                    DOB               = HC("DOB")             ? dr["DOB"]?.ToString()             ?? "" : "",
                    DomicileDistrict  = HC("DomicileDistrict")? dr["DomicileDistrict"]?.ToString()?? "" : "",
                    Category          = HC("Category")        ? dr["Category"]?.ToString()        ?? "" : "",
                    PhotoURL          = HC("PhotoURL")         ? dr["PhotoURL"]?.ToString()         ?? "" : "",
                    SignURL            = HC("SignURL")          ? dr["SignURL"]?.ToString()          ?? "" : "",

                    AcademicWeightage     = HC("AcademicWeightage")     ? dr["AcademicWeightage"]?.ToString()     ?? "" : "",
                    Weightage712          = HC("7/12Weightage")         ? dr["7/12Weightage"]?.ToString()         ?? "" : "",
                    NCCWeightage          = HC("NCCWeightage")          ? dr["NCCWeightage"]?.ToString()          ?? "" : "",
                    SportWeightage        = HC("SportWeightage")        ? dr["SportWeightage"]?.ToString()        ?? "" : "",
                    MPKVEmployeeWeightage = HC("MPKVEmployeeWeightage") ? dr["MPKVEmployeeWeightage"]?.ToString() ?? "" : "",
                    TotalWeightage        = HC("TotalWeightage")        ? dr["TotalWeightage"]?.ToString()        ?? "" : "",

                    AllotmentPhase   = HC("AllotmentPhase")  ? dr["AllotmentPhase"]?.ToString()  ?? "" : "",
                    AllottedCollege  = allottedCollegeCode + (HC("AllottedCollege") ? " - " + (dr["AllottedCollege"]?.ToString() ?? "") : ""),
                    AllottedCourse   = HC("AllottedCourse")  ? dr["AllottedCourse"]?.ToString()  ?? "" : "",
                    AllottedCategory = HC("AllottedCategory")? dr["AllottedCategory"]?.ToString()?? "" : "",
                    AllottedType     = HC("AllottedType")    ? dr["AllottedType"]?.ToString()    ?? "" : "",
                    AdmissionSchedule= HC("AdmissionSchedule")? dr["AdmissionSchedule"]?.ToString()?? "" : "",

                    RefusalRemainingFee = HC("RefusalRemainingFee") && dr["RefusalRemainingFee"] != DBNull.Value
                        ? Convert.ToInt32(dr["RefusalRemainingFee"]) : 0,

                    IsAllotmentLetterDownloaded         = HC("IsAllotmentLetterDownloaded")         && dr["IsAllotmentLetterDownloaded"]         != DBNull.Value && Convert.ToBoolean(dr["IsAllotmentLetterDownloaded"]),
                    IsEligibleToDownloadAllotmentLetter = HC("IsEligibleToDownloadAllotmentLetter") && dr["IsEligibleToDownloadAllotmentLetter"] != DBNull.Value && Convert.ToBoolean(dr["IsEligibleToDownloadAllotmentLetter"]),

                    CandidateID  = candidateId,
                    CollegeID    = HC("AllottedCollegeID") && dr["AllottedCollegeID"] != DBNull.Value ? Convert.ToInt64(dr["AllottedCollegeID"]) : 0,
                    PhaseID      = phaseId,
                    AllottedCollegeCode = allottedCollegeCode,
                };

                // Refusal fee payment history (Tables[1]) — mirrors gvRefusalFee binding
                if (ds.Tables.Count > 1 && ds.Tables[1].Rows.Count > 0)
                {
                    var t1 = ds.Tables[1];
                    bool H1(string n) => t1.Columns.Contains(n);
                    foreach (System.Data.DataRow r in t1.Rows)
                    {
                        dto.RefusalFeePayments.Add(new RefusalFeeItem
                        {
                            TransactionID  = H1("TransactionID")  ? r["TransactionID"]?.ToString()  ?? "" : "",
                            FeeAmount      = H1("FeeAmount")       ? r["FeeAmount"]?.ToString()       ?? "" : "",
                            TransactionDate= H1("TransactionDate") ? r["TransactionDate"]?.ToString() ?? "" : "",
                            PaymentDate    = H1("PaymentDate")     ? r["PaymentDate"]?.ToString()     ?? "" : "",
                            BankReferenceNo= H1("BankReferenceNo") ? r["BankReferenceNo"]?.ToString() ?? "" : "",
                            Purpose        = H1("Purpose")         ? r["Purpose"]?.ToString()         ?? "" : "",
                        });
                    }
                }

                return new AllotmentStatusResponse { Success = true, Data = dto };
            }
            catch (Exception ex)
            {
                return new AllotmentStatusResponse { Success = false, Message = ex.Message };
            }
        }

        // ══════════════════════════════════════════════════════════════════════
        // SaveDownloadStatus
        // SP: Admission_SaveDownloadAllotmentLetterStatus
        // Returns "Y" on success → frontend opens print popup
        // Mirrors: btnDownloadAllotmentLetter_Click
        // ══════════════════════════════════════════════════════════════════════
        public DownloadAllotmentLetterResponse SaveDownloadStatus(long candidateId, long collegeId, short phaseId, string userLoginId, string ipAddress)
        {
            try
            {
                var param = new DynamicParameters();
                param.Add("@PhaseID",     phaseId);
                param.Add("@CandidateID", candidateId);
                param.Add("@CollegeID",   collegeId);
                param.Add("@UserLoginID", userLoginId);
                param.Add("@IPAddress",   ipAddress);

                var result = _db.ExecuteScalar("Admission_SaveDownloadAllotmentLetterStatus", param)?.ToString() ?? "";

                if (result.ToUpper() == "Y")
                {
                    // Build print URL — mirrors: AllotmentLetterPrint.aspx?P1=CandidateID&P2=hashcode&R1=PhaseID
                    var printUrl = $"/api/admission/allotment-letter-print?p1={candidateId}&p2={candidateId.GetHashCode()}&r1={phaseId}";
                    return new DownloadAllotmentLetterResponse { Success = true, Message = "Allotment letter ready.", PrintUrl = printUrl };
                }
                return new DownloadAllotmentLetterResponse { Success = false, Message = result.Length > 0 ? result : "Data has not been saved. Please try again." };
            }
            catch (Exception ex)
            {
                return new DownloadAllotmentLetterResponse { Success = false, Message = ex.Message };
            }
        }

        // ══════════════════════════════════════════════════════════════════════
        // InitiateRefusalFee
        // SP: Fee_SetFeeTransaction(@PayeeID, @PhaseID, @PaymentGatewayID, @UserLoginID, @IPAddress)
        // Only valid for PhaseID 1, 5, 8 with RefusalRemainingFee > 0
        // Mirrors: btnPayRefusalFee_Click
        // ══════════════════════════════════════════════════════════════════════
        public RefusalFeeInitiateResponse InitiateRefusalFee(long candidateId, int phaseId, short paymentGatewayId, string userLoginId, string ipAddress)
        {
            try
            {
                if (candidateId <= 0)
                    return new RefusalFeeInitiateResponse { Success = false, Message = "Invalid candidate." };

                // Only phases 1, 5, 8 allowed — mirrors old code check
                if (phaseId != 1 && phaseId != 5 && phaseId != 8)
                    return new RefusalFeeInitiateResponse { Success = false, Message = "Currently No Fee to be Paid." };

                if (paymentGatewayId <= 0)
                    return new RefusalFeeInitiateResponse { Success = false, Message = "Please Select Payment Gateway." };

                var param = new DynamicParameters();
                param.Add("@PayeeID",          candidateId);
                param.Add("@PhaseID",          phaseId);
                param.Add("@PaymentGatewayID", paymentGatewayId);
                param.Add("@UserLoginID",      userLoginId);
                param.Add("@IPAddress",        ipAddress);

                var dt = _db.GetDataTable("Fee_SetFeeTransaction", param);
                if (dt == null || dt.Rows.Count == 0)
                    return new RefusalFeeInitiateResponse { Success = false, Message = "Some error has occurred. Please try again." };

                var row = dt.Rows[0];
                bool HC(string n) => dt.Columns.Contains(n);

                var sf  = HC("SuccessFlag")  ? row["SuccessFlag"]?.ToString()  ?? "" : "";
                var err = HC("ErrorMessage") ? row["ErrorMessage"]?.ToString() ?? "" : "";

                if (sf.ToUpper() != "Y")
                    return new RefusalFeeInitiateResponse { Success = false, Message = err.Length > 0 ? err : "Some error has occurred. Please try again." };

                var txId   = HC("TransactionID")     && row["TransactionID"]     != DBNull.Value ? Convert.ToInt64(row["TransactionID"]) : 0;
                var gwUrl  = HC("PaymentGatewayURL") ? row["PaymentGatewayURL"]?.ToString() ?? "" : "";

                if (txId <= 0)
                    return new RefusalFeeInitiateResponse { Success = false, Message = "Invalid transaction ID." };

                return new RefusalFeeInitiateResponse
                {
                    Success           = true,
                    TransactionID     = txId,
                    PaymentGatewayURL = $"{gwUrl}?T1={txId}&T2={txId.GetHashCode()}"
                };
            }
            catch (Exception ex)
            {
                return new RefusalFeeInitiateResponse { Success = false, Message = ex.Message };
            }
        }
    }
}
