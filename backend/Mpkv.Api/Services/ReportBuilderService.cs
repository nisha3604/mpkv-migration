using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.Admin;

namespace Mpkv.Api.Services
{
    public interface IReportBuilderService
    {
        ReportListResponse    GetList(short regionId);
        ReportDetailsResponse GetReport(int reportId);
        SaveReportResponse    Save(int reportId, string reportName, string reportQuery, short regionId, string userLoginId, string ipAddress);
        DeleteReportResponse  Delete(int reportId, string userLoginId, string ipAddress);
        ExecuteReportResponse Execute(int reportId);
        TableViewListResponse GetTableViewList();
        ColumnListResponse    GetColumnList(string tableViewName);
    }

    /// <summary>
    /// Mirrors ManageReports.aspx.
    /// SPs:
    ///   Administration_GetReportList(@RegionID)
    ///   Administration_GetReport(@ReportID)
    ///   Administration_SaveReport(@ReportID, @ReportName, @ReportQuery, @RegionID, @UserLoginID, @IPAddress)
    ///   Administration_DeleteReport(@ReportID, @UserLoginID, @IPAddress)
    ///   Administration_ExecuteReport(@ReportID)
    ///   Administration_GetTableViewList()
    ///   Administration_GetColumnList(@TableViewName)
    ///   Administration_GetRestrictedKeywordList()
    ///
    /// Security: blocked keywords checked against Administration_GetRestrictedKeywordList
    ///           plus hard-coded list: INSERT, DELETE, UPDATE, CREATE, ALTER, DROP, TRUNCATE
    /// </summary>
    public class ReportBuilderService : IReportBuilderService
    {
        private readonly DbAccess _db;

        // Hard-coded blocked keywords (same as ManageReports.aspx.cs)
        private static readonly HashSet<string> BLOCKED = new(StringComparer.OrdinalIgnoreCase)
            { "INSERT", "DELETE", "UPDATE", "CREATE", "ALTER", "DROP", "TRUNCATE" };

        public ReportBuilderService(DbAccess db) => _db = db;

        public ReportListResponse GetList(short regionId)
        {
            var r = new ReportListResponse();
            try
            {
                var p = new DynamicParameters(); p.Add("@RegionID", regionId);
                var dt = _db.GetDataTable("Administration_GetReportList", p);
                if (dt == null) { r.Success = true; return r; }
                bool HC(string n) => dt.Columns.Contains(n);
                foreach (System.Data.DataRow row in dt.Rows)
                    r.Items.Add(new ReportListItem
                    {
                        ReportID   = HC("ReportID")   && row["ReportID"]   != DBNull.Value ? Convert.ToInt32(row["ReportID"]) : 0,
                        ReportName = HC("ReportName") ? row["ReportName"]?.ToString() ?? "" : "",
                    });
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        public ReportDetailsResponse GetReport(int reportId)
        {
            var r = new ReportDetailsResponse();
            try
            {
                var p = new DynamicParameters(); p.Add("@ReportID", reportId);
                var dt = _db.GetDataTable("Administration_GetReport", p);
                if (dt == null || dt.Rows.Count == 0) { r.Success = false; r.Message = "Report not found."; return r; }
                bool HC(string n) => dt.Columns.Contains(n);
                var row = dt.Rows[0];
                r.ReportID    = reportId;
                r.ReportName  = HC("ReportName")  ? row["ReportName"]?.ToString()  ?? "" : "";
                r.ReportQuery = HC("ReportQuery") ? row["ReportQuery"]?.ToString() ?? "" : "";
                r.Success     = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        public SaveReportResponse Save(int reportId, string reportName, string reportQuery,
                                       short regionId, string userLoginId, string ipAddress)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(reportName))
                    return new SaveReportResponse { Success = false, Message = "Report name is required." };
                if (string.IsNullOrWhiteSpace(reportQuery))
                    return new SaveReportResponse { Success = false, Message = "Report query is required." };

                // Check restricted keywords from DB
                try
                {
                    var kdt = _db.GetDataTable("Administration_GetRestrictedKeywordList");
                    if (kdt != null)
                    {
                        var words = reportQuery.ToUpper().Split(' ', '\n', '\r', '\t');
                        var found = new List<string>();
                        foreach (System.Data.DataRow krow in kdt.Rows)
                        {
                            var kw = krow[0]?.ToString() ?? "";
                            if (!string.IsNullOrEmpty(kw) && words.Any(w => w.Equals(kw, StringComparison.OrdinalIgnoreCase)))
                                found.Add(kw);
                        }
                        if (found.Count > 0)
                            return new SaveReportResponse { Success = false, Message = $"You cannot use: {string.Join(", ", found)}" };
                    }
                }
                catch { /* Non-critical — fall through to hard-coded check */ }

                // Hard-coded check (same as old project)
                var queryWords = reportQuery.ToUpper().Split(' ');
                var blocked    = queryWords.Where(w => BLOCKED.Contains(w.Trim())).ToList();
                if (blocked.Count > 0)
                    return new SaveReportResponse { Success = false, Message = $"Report query cannot contain keywords: {string.Join(", ", blocked)}" };

                var p = new DynamicParameters();
                p.Add("@ReportID",    reportId);
                p.Add("@ReportName",  reportName.Trim());
                p.Add("@ReportQuery", reportQuery.Trim());
                p.Add("@RegionID",    regionId);
                p.Add("@UserLoginID", userLoginId);
                p.Add("@IPAddress",   ipAddress);
                var result = _db.ExecuteScalar("Administration_SaveReport", p)?.ToString() ?? "";
                bool ok = result.ToUpper() == "Y" || result == "1";
                return new SaveReportResponse { Success = ok, Message = ok ? "Report saved successfully." : result };
            }
            catch (Exception ex) { return new SaveReportResponse { Success = false, Message = ex.Message }; }
        }

        public DeleteReportResponse Delete(int reportId, string userLoginId, string ipAddress)
        {
            try
            {
                var p = new DynamicParameters();
                p.Add("@ReportID",    reportId);
                p.Add("@UserLoginID", userLoginId);
                p.Add("@IPAddress",   ipAddress);
                var result = _db.ExecuteScalar("Administration_DeleteReport", p)?.ToString() ?? "";
                bool ok = result.ToUpper() == "Y" || result == "1";
                return new DeleteReportResponse { Success = ok, Message = ok ? "Report deleted successfully." : result };
            }
            catch (Exception ex) { return new DeleteReportResponse { Success = false, Message = ex.Message }; }
        }

        public ExecuteReportResponse Execute(int reportId)
        {
            var r = new ExecuteReportResponse();
            try
            {
                var p = new DynamicParameters(); p.Add("@ReportID", reportId);
                var dt = _db.GetDataTable("Administration_ExecuteReport", p);
                if (dt == null) { r.Success = true; return r; }

                // Get report name for the filename
                try
                {
                    var rdet = GetReport(reportId);
                    r.FileName = rdet.ReportName.Replace(' ', '_');
                }
                catch { r.FileName = $"Report_{reportId}"; }

                // Columns
                foreach (System.Data.DataColumn col in dt.Columns)
                    r.Columns.Add(col.ColumnName);

                // Rows — all values as strings
                foreach (System.Data.DataRow row in dt.Rows)
                    r.Rows.Add(row.ItemArray.Select(v => v?.ToString()).ToList());

                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        public TableViewListResponse GetTableViewList()
        {
            var r = new TableViewListResponse();
            try
            {
                var dt = _db.GetDataTable("Administration_GetTableViewList");
                if (dt != null)
                    foreach (System.Data.DataRow row in dt.Rows)
                        r.Items.Add(row[0]?.ToString() ?? "");
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        public ColumnListResponse GetColumnList(string tableViewName)
        {
            var r = new ColumnListResponse();
            try
            {
                var p = new DynamicParameters(); p.Add("@TableViewName", tableViewName);
                var dt = _db.GetDataTable("Administration_GetColumnList", p);
                if (dt != null)
                    foreach (System.Data.DataRow row in dt.Rows)
                        r.Columns.Add(row[0]?.ToString() ?? "");
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }
    }
}
