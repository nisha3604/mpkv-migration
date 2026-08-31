using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.College;

namespace Mpkv.Api.Services
{
    public interface ICollegeDashboardService
    {
        CollegeDashboardResponse GetDashboard(long collegeId, string userLoginId, int userTypeId);
    }

    /// <summary>
    /// Mirrors DashboardCollege.aspx.cs Page_Load logic.
    /// SP: Dashboard_GetCollegeDashboard(@CollegeID) → Intake, Admitted, Vacancy
    /// SP: Account_GetLoggedInUserDetails(@UserTypeID, @UserLoginID) → session info
    /// </summary>
    public class CollegeDashboardService : ICollegeDashboardService
    {
        private readonly DbAccess _db;

        public CollegeDashboardService(DbAccess db) => _db = db;

        public CollegeDashboardResponse GetDashboard(long collegeId, string userLoginId, int userTypeId)
        {
            var response = new CollegeDashboardResponse();
            try
            {
                // ── Stats tile: Intake / Admitted / Vacancy ───────────────────
                var param = new DynamicParameters();
                param.Add("@CollegeID", collegeId);
                var dt = _db.GetDataTable("Dashboard_GetCollegeDashboard", param);

                var dashboard = new CollegeDashboardDto
                {
                    UserLoginID = userLoginId,
                };

                if (dt != null && dt.Rows.Count > 0)
                {
                    var row = dt.Rows[0];
                    bool H(string n) => dt.Columns.Contains(n) && row[n] != DBNull.Value;
                    dashboard.Intake   = H("Intake")   ? Convert.ToInt32(row["Intake"])   : 0;
                    dashboard.Admitted = H("Admitted") ? Convert.ToInt32(row["Admitted"]) : 0;
                    dashboard.Vacancy  = H("Vacancy")  ? Convert.ToInt32(row["Vacancy"])  : 0;
                }

                // ── College name from College_GetCollegeSummary ───────────────
                try
                {
                    var pc = new DynamicParameters();
                    pc.Add("@CollegeID", collegeId);
                    var dtC = _db.GetDataTable("College_GetCollegeSummary", pc);
                    if (dtC != null && dtC.Rows.Count > 0 && dtC.Columns.Contains("CollegeName"))
                        dashboard.CollegeName = dtC.Rows[0]["CollegeName"]?.ToString() ?? "";
                }
                catch { /* non-critical */ }

                // ── Session info: user type label ─────────────────────────────
                dashboard.UserType = userTypeId switch
                {
                    11 or 12 => "Administrator",
                    61       => "College",
                    91       => "Candidate",
                    _        => "User"
                };

                // ── Last login time from DB ───────────────────────────────────
                // Always set a fallback so CurrentLoginDateTime is never blank.
                dashboard.CurrentLoginDateTime = DateTime.Now.ToString("dd/MM/yyyy hh:mm:ss tt");
                try
                {
                    var p2 = new DynamicParameters();
                    p2.Add("@UserTypeID",  userTypeId);
                    p2.Add("@UserLoginID", userLoginId);
                    var dt2 = _db.GetDataTable("Account_GetLoggedInUserDetails", p2);
                    if (dt2 != null && dt2.Rows.Count > 0)
                    {
                        var r2 = dt2.Rows[0];
                        bool H2(string n) => dt2.Columns.Contains(n) && r2[n] != DBNull.Value;

                        if (H2("UserName"))
                            dashboard.UserName = r2["UserName"]?.ToString() ?? "";

                        // CurrentLoginDateTime — prefer DB value, keep DateTime.Now fallback if absent
                        if (H2("CurrentLoginDateTime"))
                        {
                            var raw = r2["CurrentLoginDateTime"]?.ToString() ?? "";
                            if (DateTime.TryParse(raw, out var dt4))
                                dashboard.CurrentLoginDateTime = dt4.ToString("dd/MM/yyyy hh:mm:ss tt");
                        }

                        // LastLoginDateTime — only set when the DB has a real previous-session value
                        if (H2("LastLoginDateTime"))
                        {
                            var raw = r2["LastLoginDateTime"]?.ToString() ?? "";
                            if (DateTime.TryParse(raw, out var dt3))
                                dashboard.LastLoginDateTime = dt3.ToString("dd/MM/yyyy hh:mm:ss tt");
                            else if (!string.IsNullOrWhiteSpace(raw))
                                dashboard.LastLoginDateTime = raw;
                        }
                    }
                }
                catch (Exception loginEx)
                {
                    // Non-critical — log but do not break the dashboard
                    Console.WriteLine($"[CollegeDashboard] Login times SP error: {loginEx.Message}");
                }

                response.Success   = true;
                response.Dashboard = dashboard;
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Message = ex.Message;
            }
            return response;
        }
    }
}
