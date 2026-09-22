namespace Mpkv.Api.Models.Admin
{
    // ── Project Configuration List ────────────────────────────────────────────
    public class ConfigListResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public List<ConfigItem> Items { get; set; } = new();
    }

    public class ConfigItem
    {
        public string AppKey        { get; set; } = "";
        public string AppKeyDetails { get; set; } = "";
        public string AppValue      { get; set; } = "";
    }

    // ── Project Configuration Details (for edit) ──────────────────────────────
    public class ConfigDetailsResponse
    {
        public bool   Success         { get; set; }
        public string Message         { get; set; } = "";
        public string AppKey          { get; set; } = "";
        public string AppKeyDetails   { get; set; } = "";
        public string AppValue        { get; set; } = "";
        /// <summary>"TextBox" or "DropDownList"</summary>
        public string ControlRequired { get; set; } = "TextBox";
        /// <summary>Max numeric value for DropDownList (0..N range)</summary>
        public int    ControlMaxValue { get; set; }
    }

    // ── Save Project Configuration ────────────────────────────────────────────
    public class SaveConfigRequest
    {
        public string AppKey   { get; set; } = "";
        public string AppValue { get; set; } = "";
    }

    public class SaveConfigResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
    }

    // ── Reports Builder ───────────────────────────────────────────────────────
    public class ReportListResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public List<ReportListItem> Items { get; set; } = new();
    }

    public class ReportListItem
    {
        public int    ReportID   { get; set; }
        public string ReportName { get; set; } = "";
    }

    public class ReportDetailsResponse
    {
        public bool   Success     { get; set; }
        public string Message     { get; set; } = "";
        public int    ReportID    { get; set; }
        public string ReportName  { get; set; } = "";
        public string ReportQuery { get; set; } = "";
    }

    public class SaveReportRequest
    {
        /// <summary>0 = new, >0 = edit</summary>
        public int    ReportID    { get; set; }
        public string ReportName  { get; set; } = "";
        public string ReportQuery { get; set; } = "";
    }

    public class SaveReportResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
    }

    public class DeleteReportResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
    }

    // ── Execute Report ────────────────────────────────────────────────────────
    public class ExecuteReportResponse
    {
        public bool   Success  { get; set; }
        public string Message  { get; set; } = "";
        public string FileName { get; set; } = "";
        public List<string>              Columns { get; set; } = new();
        public List<List<string?>> Rows    { get; set; } = new();
    }

    // ── Table/View + Column browser ───────────────────────────────────────────
    public class TableViewListResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public List<string> Items { get; set; } = new();
    }

    public class ColumnListResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public List<string> Columns { get; set; } = new();
    }

    // ── Reports List page (ReportsList.aspx) ─────────────────────────────────
    public class ReportsListPageResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public List<ReportsListItem> Items { get; set; } = new();
    }
    public class ReportsListItem
    {
        public int    ReportID   { get; set; }
        public string ReportName { get; set; } = "";
    }

    // ── Generate Report page (GenerateReport.aspx) ───────────────────────────
    public class GenerateReportResponse
    {
        public bool   Success      { get; set; }
        public string Message      { get; set; } = "";
        public string ReportHeader { get; set; } = "";   // card title + Excel header
        public string FileName     { get; set; } = "";   // underscored name for download
        public List<string>              Columns { get; set; } = new();
        public List<List<string?>>       Rows    { get; set; } = new();
    }
}
