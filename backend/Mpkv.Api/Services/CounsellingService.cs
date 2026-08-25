using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.College;

namespace Mpkv.Api.Services
{
    public interface ICounsellingService
    {
        CounsellingPhasesResponse GetPhases(int userTypeId, int courseId, string userLoginId);
        CounsellingCheckResponse  Check(string applicationId, short phaseId, string flag,
                                        int userTypeId, int courseId, int districtId, string userLoginId);
    }

    /// <summary>
    /// Mirrors Counselling/CheckApplicationID.aspx.cs exactly.
    ///
    /// Page_Load:
    ///   1. Access check: UserTypeID must be 31 or 61
    ///   2. College restriction: UserTypeID=61 AND CourseID != 3 →
    ///      FormVisible=false + error "You are Not Authorized to Offer Seat in Spot Round."
    ///   3. Load phases: Admission_GetPhaseList(@UserTypeID, @Flag="Counselling", @UserLoginID)
    ///   4. Auto-select current phase: Admission_GetCurrentPhaseID()
    ///   5. OfferSeat flag: ddlPhase.Enabled=false (always disabled for this flag)
    ///
    /// btnSearch_Click:
    ///   OfferSeat:
    ///     Base_GetCandidateID → Counselling_GetEligibilityFlagForCounselling
    ///     → IsEligible=true → navigate to /college/spot-round/offer-seat-form
    ///     → IsEligible=false → show ErrMsg
    ///   CancelOfferedSeat:
    ///     Base_GetCandidateID → Counselling_GetEligibilityFlagForCancelOfferedSeat
    ///     → IsEligible=true → navigate to /college/spot-round/cancel-offered-seat-form
    ///     → IsEligible=false → show ErrMsg
    /// </summary>
    public class CounsellingService : ICounsellingService
    {
        private readonly DbAccess _db;
        public CounsellingService(DbAccess db) => _db = db;

        // ══════════════════════════════════════════════════════════════════════
        // GetPhases — Page_Load logic
        // ══════════════════════════════════════════════════════════════════════
        public CounsellingPhasesResponse GetPhases(int userTypeId, int courseId, string userLoginId)
        {
            var response = new CounsellingPhasesResponse();

            // Access check — mirrors: if (user.UserTypeID != 31 && user.UserTypeID != 61)
            if (userTypeId != 31 && userTypeId != 61)
            {
                response.Success     = false;
                response.AccessError = "Access Denied.";
                response.FormVisible = false;
                return response;
            }

            // College restriction — mirrors: if (user.UserTypeID == 61 && user.CourseID != 3)
            if (userTypeId == 61 && courseId != 3)
            {
                response.Success     = false;
                response.FormVisible = false;
                response.AccessError = "You are Not Authorized to Offer Seat in Spot Round.";
                return response;
            }

            try
            {
                // Load phases with Flag="Counselling"
                var param = new DynamicParameters();
                param.Add("@UserTypeID",  userTypeId);
                param.Add("@Flag",        "Counselling");
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

                // Auto-select current phase
                try
                {
                    var cur = _db.ExecuteScalar("Admission_GetCurrentPhaseID");
                    response.CurrentPhaseID = cur != null ? Convert.ToInt32(cur) : 0;
                }
                catch { response.CurrentPhaseID = 0; }

                response.Success     = true;
                response.FormVisible = true;
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Message = ex.Message;
            }

            return response;
        }

        // ══════════════════════════════════════════════════════════════════════
        // Check — btnSearch_Click logic
        // ══════════════════════════════════════════════════════════════════════
        public CounsellingCheckResponse Check(
            string applicationId, short phaseId, string flag,
            int userTypeId, int courseId, int districtId, string userLoginId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(applicationId))
                    return new CounsellingCheckResponse { Success = false, Message = "Please Enter Application Number." };
                if (phaseId <= 0)
                    return new CounsellingCheckResponse { Success = false, Message = "Please Select Round." };

                // Access check
                if (userTypeId != 31 && userTypeId != 61)
                    return new CounsellingCheckResponse { Success = false, Message = "Access Denied." };

                if (userTypeId == 61 && courseId != 3)
                    return new CounsellingCheckResponse { Success = false, Message = "You are Not Authorized to Offer Seat in Spot Round.", FormVisible = false };

                // Step 1: Get CandidateID — mirrors BaseWorker().GetCandidateID(txtApplicationID.Text)
                var idParam = new DynamicParameters();
                idParam.Add("@ApplicationID", applicationId.Trim().ToUpper());
                var candidateIdObj = _db.ExecuteScalar("Base_GetCandidateID", idParam);

                if (candidateIdObj == null || Convert.ToInt64(candidateIdObj) == 0)
                    return new CounsellingCheckResponse { Success = false, Message = "Invalid Application ID." };

                long candidateId = Convert.ToInt64(candidateIdObj);

                if (flag == "OfferSeat")
                {
                    // Counselling_GetEligibilityFlagForCounselling(@CandidateID, @PhaseID, @UserLoginID)
                    var param = new DynamicParameters();
                    param.Add("@CandidateID", candidateId);
                    param.Add("@PhaseID",     phaseId);
                    param.Add("@UserLoginID", userLoginId);

                    var dt = _db.GetDataTable("Counselling_GetEligibilityFlagForCounselling", param);

                    if (dt == null || dt.Rows.Count == 0)
                        return new CounsellingCheckResponse { Success = false, Message = "Not Eligible for Counselling." };

                    var row = dt.Rows[0];
                    bool isEligible = row["IsEligible"] != DBNull.Value && Convert.ToBoolean(row["IsEligible"]);
                    string errMsg   = dt.Columns.Contains("ErrMsg") ? row["ErrMsg"]?.ToString() ?? "" : "";

                    if (!isEligible)
                        return new CounsellingCheckResponse { Success = false, Message = errMsg.Length > 0 ? errMsg : "Not Eligible for Counselling." };

                    // Eligible → build navigate URL
                    // Mirrors: Response.Redirect("../Counselling/OfferSeat.aspx?P1=" + CandidateID + "&P2=" + hash + "&R1=" + PhaseID)
                    return new CounsellingCheckResponse
                    {
                        Success    = true,
                        NavigateTo = $"/college/spot-round/offer-seat-form?p1={candidateId}&p2={candidateId.GetHashCode()}&r1={phaseId}"
                    };
                }
                else if (flag == "CancelOfferedSeat")
                {
                    // Counselling_GetEligibilityFlagForCancelOfferedSeat(@CandidateID, @PhaseID, @DistrictID, @UserLoginID)
                    var param = new DynamicParameters();
                    param.Add("@CandidateID", candidateId);
                    param.Add("@PhaseID",     phaseId);
                    param.Add("@DistrictID",  districtId);
                    param.Add("@UserLoginID", userLoginId);

                    var dt = _db.GetDataTable("Counselling_GetEligibilityFlagForCancelOfferedSeat", param);

                    if (dt == null || dt.Rows.Count == 0)
                        return new CounsellingCheckResponse { Success = false, Message = "Not Eligible for Counselling." };

                    var row = dt.Rows[0];
                    bool isEligible = row["IsEligible"] != DBNull.Value && Convert.ToBoolean(row["IsEligible"]);
                    string errMsg   = dt.Columns.Contains("ErrMsg") ? row["ErrMsg"]?.ToString() ?? "" : "";

                    if (!isEligible)
                        return new CounsellingCheckResponse { Success = false, Message = errMsg.Length > 0 ? errMsg : "Not Eligible for Counselling." };

                    return new CounsellingCheckResponse
                    {
                        Success    = true,
                        NavigateTo = $"/college/spot-round/cancel-offered-seat-form?p1={candidateId}&p2={candidateId.GetHashCode()}&r1={phaseId}"
                    };
                }

                return new CounsellingCheckResponse { Success = false, Message = "Invalid flag." };
            }
            catch (Exception ex)
            {
                return new CounsellingCheckResponse { Success = false, Message = ex.Message };
            }
        }
    }
}
