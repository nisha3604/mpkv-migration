namespace Mpkv.Api.Models.College
{
    // ══════════════════════════════════════════════════════════════════════════
    // College Dashboard — mirrors DashboardCollege.aspx tiles
    // SP: Dashboard_GetCollegeDashboard(@CollegeID)
    // Returns: Intake, Admitted, Vacancy
    // ══════════════════════════════════════════════════════════════════════════

    public class CollegeDashboardDto
    {
        public int    Intake   { get; set; }
        public int    Admitted { get; set; }
        public int    Vacancy  { get; set; }
        // Session info shown on dashboard (from Account_GetLoggedInUserDetails)
        public string UserLoginID          { get; set; } = string.Empty;
        public string UserType             { get; set; } = string.Empty;
        public string UserName             { get; set; } = string.Empty;
        public string CurrentLoginDateTime { get; set; } = string.Empty;
        public string LastLoginDateTime    { get; set; } = string.Empty;
    }

    public class CollegeDashboardResponse
    {
        public bool               Success   { get; set; }
        public string             Message   { get; set; } = string.Empty;
        public CollegeDashboardDto? Dashboard { get; set; }
    }
}
