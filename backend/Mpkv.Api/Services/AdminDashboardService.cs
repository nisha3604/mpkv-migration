using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.Admin;

namespace Mpkv.Api.Services
{
    public interface IAdminDashboardService
    {
        AdminDashboardResponse GetDashboard(int userTypeId, string userLoginId);
    }

    /// <summary>
    /// Mirrors DashboardAdmin.aspx + DashboardSuperAdmin.aspx (identical code).
    /// SP: Dashboard_GetAdminDashboard(@UserTypeID, @UserLoginID)
    ///   → Returns Tables[0] with all stat columns _1/_2/_3 per course
    /// Also fetches course names from Base_GetMasterCourse for block headers.
    /// </summary>
    public class AdminDashboardService : IAdminDashboardService
    {
        private readonly DbAccess _db;
        public AdminDashboardService(DbAccess db) => _db = db;

        public AdminDashboardResponse GetDashboard(int userTypeId, string userLoginId)
        {
            var r = new AdminDashboardResponse();
            try
            {
                var data = new AdminDashboardData
                {
                    UserLoginID          = userLoginId,
                    UserType             = userTypeId == 11 ? "Super Admin" : "Admin",
                    CurrentLoginDateTime = DateTime.Now.ToString("dd/MM/yyyy hh:mm:ss tt"),
                };

                // ── Stat tiles ────────────────────────────────────────────────
                var p = new DynamicParameters();
                p.Add("@UserTypeID",  userTypeId);
                p.Add("@UserLoginID", userLoginId);
                var ds = _db.GetDataSet("Dashboard_GetAdminDashboard", p);

                if (ds != null && ds.Tables.Count > 0 && ds.Tables[0].Rows.Count > 0)
                {
                    var row = ds.Tables[0].Rows[0];
                    bool HC(string n) => ds.Tables[0].Columns.Contains(n) && row[n] != DBNull.Value;
                    string S(string n) => HC(n) ? row[n]?.ToString() ?? "0" : "0";

                    data.Registered_1        = S("Registered_1");
                    data.Locked_1            = S("Locked_1");
                    data.FullyVerified_1     = S("FullyVerified_1");
                    data.PartiallyVerified_1 = S("PartiallyVerified_1");
                    data.NoOfColleges_1      = S("NoOfColleges_1");
                    data.Intake_1            = S("Intake_1");
                    data.Admitted_1          = S("Admitted_1");
                    data.Vacancy_1           = S("Vacancy_1");

                    data.Registered_2        = S("Registered_2");
                    data.Locked_2            = S("Locked_2");
                    data.FullyVerified_2     = S("FullyVerified_2");
                    data.PartiallyVerified_2 = S("PartiallyVerified_2");
                    data.NoOfColleges_2      = S("NoOfColleges_2");
                    data.Intake_2            = S("Intake_2");
                    data.Admitted_2          = S("Admitted_2");
                    data.Vacancy_2           = S("Vacancy_2");

                    data.Registered_3        = S("Registered_3");
                    data.Locked_3            = S("Locked_3");
                    data.FullyVerified_3     = S("FullyVerified_3");
                    data.PartiallyVerified_3 = S("PartiallyVerified_3");
                    data.NoOfColleges_3      = S("NoOfColleges_3");
                    data.Intake_3            = S("Intake_3");
                    data.Admitted_3          = S("Admitted_3");
                    data.Vacancy_3           = S("Vacancy_3");
                }

                // ── Course names for block headers ────────────────────────────
                try
                {
                    var dt = _db.GetDataTable("Base_GetMasterCourse");
                    if (dt != null && dt.Rows.Count >= 1)
                        data.CourseName_1 = dt.Rows[0]["Course"]?.ToString() ?? "Course 1";
                    if (dt != null && dt.Rows.Count >= 2)
                        data.CourseName_2 = dt.Rows[1]["Course"]?.ToString() ?? "Course 2";
                    if (dt != null && dt.Rows.Count >= 3)
                        data.CourseName_3 = dt.Rows[2]["Course"]?.ToString() ?? "Course 3";
                }
                catch { /* non-critical */ }

                r.Success = true;
                r.Data    = data;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }
    }
}
