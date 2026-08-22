using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.Candidate;

namespace Mpkv.Api.Services
{
    public interface IDashboardService
    {
        CandidateDashboardResponse GetDashboard(long candidateID);
        ApplicationProgressResponse GetApplicationProgress(long candidateID);
    }

    public class DashboardService : IDashboardService
    {
        private readonly DbAccess _db;
        public DashboardService(DbAccess db) => _db = db;

        public CandidateDashboardResponse GetDashboard(long candidateID)
        {
            var response = new CandidateDashboardResponse();
            try
            {
                var param = new DynamicParameters();
                param.Add("@CandidateID", candidateID);
                var ds = _db.GetDataSet("Dashboard_GetCandidateDashboard", param);
                if (ds.Tables.Count > 0 && ds.Tables[0].Rows.Count > 0) { var row = ds.Tables[0].Rows[0]; response.ApplicationFormStatus = row["ApplicationFormStatus"].ToString()!; response.DocumentVerificationStatus = row["DocumentVerificationStatus"].ToString()!; }
                if (ds.Tables.Count > 1 && ds.Tables[1].Rows.Count > 0) foreach (System.Data.DataRow row in ds.Tables[1].Rows) response.RejectedDocuments.Add(new RejectedDocumentDto { Document = row["Document"].ToString()!, Comments = row["Comments"].ToString()! });
                response.Progress = GetApplicationProgress(candidateID);
                response.IsFormLocked = false;
            }
            catch (Exception ex) { response.ApplicationFormStatus = "Error loading status."; Console.WriteLine($"GetDashboard error: {ex.Message}"); }
            return response;
        }

        public ApplicationProgressResponse GetApplicationProgress(long candidateID)
        {
            var progress = new ApplicationProgressResponse();
            try
            {
                var param = new DynamicParameters();
                param.Add("@CandidateID", candidateID);
                var dt = _db.GetDataTable("Dashboard_GetApplicationProgress", param);
                if (dt == null || dt.Rows.Count == 0) return progress;
                var row = dt.Rows[0];
                progress.Registration     = Convert.ToBoolean(row["Registration"]);
                progress.PersonalInfo     = Convert.ToBoolean(row["PersonalInfo"]);
                progress.CollegeSelection = Convert.ToBoolean(row["CollegeSelection"]);
                progress.DocumentUpload   = Convert.ToBoolean(row["DocumentUpload"]);
                progress.FeePayment       = Convert.ToBoolean(row["FeePayment"]);
                progress.TotalSteps       = Convert.ToInt32(row["TotalSteps"]);
                progress.NextStepUrl      = row["NextStepUrl"]?.ToString() ?? string.Empty;
                progress.FormLocked       = false;
                if (dt.Columns.Contains("IsFormLocked") && row["IsFormLocked"] != DBNull.Value) progress.FormLocked = Convert.ToBoolean(row["IsFormLocked"]);
                bool HC(string n) => dt.Columns.Contains(n) && row[n] != DBNull.Value;
                progress.PersonalDetails      = HC("PersonalDetails")      && Convert.ToBoolean(row["PersonalDetails"]);
                progress.AddressDetails       = HC("AddressDetails")       && Convert.ToBoolean(row["AddressDetails"]);
                progress.CategoryDetails      = HC("CategoryDetails")      && Convert.ToBoolean(row["CategoryDetails"]);
                progress.QualificationDetails = HC("QualificationDetails") && Convert.ToBoolean(row["QualificationDetails"]);
                progress.SportsDetails        = HC("SportsDetails")        ? Convert.ToBoolean(row["SportsDetails"]) : true;
                progress.ShortlistOptions     = HC("ShortlistOptions")     && Convert.ToBoolean(row["ShortlistOptions"]);
                progress.SetPreferences       = HC("SetPreferences")       && Convert.ToBoolean(row["SetPreferences"]);
                progress.PhotoAndSign         = HC("PhotoAndSign")         && Convert.ToBoolean(row["PhotoAndSign"]);
                progress.RequiredDocuments    = HC("RequiredDocuments")    && Convert.ToBoolean(row["RequiredDocuments"]);
            }
            catch (Exception ex) { Console.WriteLine($"GetApplicationProgress error: {ex.Message}"); }
            return progress;
        }
    }
}
