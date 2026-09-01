using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.Candidate;

namespace Mpkv.Api.Services
{
    public interface IDashboardService
    {
        CandidateDashboardResponse GetDashboard(long candidateID, string userLoginId);
    }

    public class DashboardService : IDashboardService
    {
        private readonly DbAccess _db;
        public DashboardService(DbAccess db) => _db = db;

        // ══════════════════════════════════════════════════════════════════════
        // GET DASHBOARD — GET /api/dashboard
        //
        // Step 1: Dashboard_GetCandidateDashboard → ApplicationFormStatus, Docs
        // Step 2: Dashboard_GetApplicationProgress → all step completion flags
        //         (SP must exist — see SQL script in project root)
        // ══════════════════════════════════════════════════════════════════════
        public CandidateDashboardResponse GetDashboard(long candidateID, string userLoginId)
        {
            var response = new CandidateDashboardResponse();
            try
            {
                // ── Step 1: status + rejected docs ───────────────────────────
                var p1 = new DynamicParameters();
                p1.Add("@CandidateID", candidateID);
                var ds = _db.GetDataSet("Dashboard_GetCandidateDashboard", p1);
                if (ds != null && ds.Tables.Count > 0 && ds.Tables[0].Rows.Count > 0)
                {
                    var row = ds.Tables[0].Rows[0];
                    response.ApplicationFormStatus      = row["ApplicationFormStatus"]?.ToString() ?? "";
                    response.DocumentVerificationStatus = row["DocumentVerificationStatus"]?.ToString() ?? "";
                }
                if (ds != null && ds.Tables.Count > 1 && ds.Tables[1].Rows.Count > 0)
                    foreach (System.Data.DataRow row in ds.Tables[1].Rows)
                        response.RejectedDocuments.Add(new RejectedDocumentDto
                        {
                            Document = row["Document"]?.ToString() ?? "",
                            Comments = row["Comments"]?.ToString() ?? ""
                        });

                // ── Step 2: progress flags ────────────────────────────────────
                var p2 = new DynamicParameters();
                p2.Add("@CandidateID", candidateID);
                var dt = _db.GetDataTable("Dashboard_GetApplicationProgress", p2);

                var progress = new ApplicationProgressResponse();
                progress.Registration = true;

                if (dt != null && dt.Rows.Count > 0)
                {
                    var row = dt.Rows[0];
                    bool HC(string n) => dt.Columns.Contains(n) && row[n] != System.DBNull.Value;
                    bool B(string n)  => HC(n) && Convert.ToBoolean(row[n]);

                    progress.PersonalInfo     = B("PersonalInfo");
                    progress.CollegeSelection = B("CollegeSelection");
                    progress.DocumentUpload   = B("DocumentUpload");
                    progress.FeePayment       = B("FeePayment");
                    progress.TotalSteps       = HC("TotalSteps") ? Convert.ToInt32(row["TotalSteps"]) : 6;
                    progress.NextStepUrl      = HC("NextStepUrl") ? row["NextStepUrl"]?.ToString() ?? "" : "";

                    // Sub-step flags
                    progress.PersonalDetails      = B("PersonalDetails");
                    progress.AddressDetails       = B("AddressDetails");
                    progress.CategoryDetails      = B("CategoryDetails");
                    progress.QualificationDetails = B("QualificationDetails");
                    progress.SportsDetails        = HC("SportsDetails") ? B("SportsDetails") : true;
                    progress.ShortlistOptions     = B("ShortlistOptions");
                    progress.SetPreferences       = B("SetPreferences");
                    progress.PhotoAndSign         = B("PhotoAndSign");
                    progress.RequiredDocuments    = B("RequiredDocuments");
                }

                // Form locked — from ApplicationFormStatus (authoritative)
                progress.FormLocked   = response.ApplicationFormStatus.ToLower() == "locked";
                response.IsFormLocked = progress.FormLocked;

                // When locked, override NextStepUrl so Proceed goes to print page
                if (progress.FormLocked)
                    progress.NextStepUrl = "ApplicationForm.aspx";

                response.Progress = progress;
            }
            catch (Exception ex)
            {
                response.ApplicationFormStatus = "Error loading status.";
                Console.WriteLine($"[GetDashboard] Error: {ex.Message}");
            }
            return response;
        }
    }
}
