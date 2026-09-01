namespace Mpkv.Api.Models.Candidate
{
    public class HomePageResponse { public bool IsRegistrationOpen { get; set; } public string WebsiteHeader { get; set; } = string.Empty; public string HelplineMobileNo { get; set; } = string.Empty; public List<MenuItemDto> MenuItems { get; set; } = new(); public List<NotificationDto> Announcements { get; set; } = new(); public List<NotificationDto> Notifications { get; set; } = new(); public List<NotificationDto> News { get; set; } = new(); public List<NotificationDto> Downloads { get; set; } = new(); public PopupDto? Popup { get; set; } }
    public class NotificationDto { public string Title { get; set; } = string.Empty; public string TextContent { get; set; } = string.Empty; public string FileContentUrl { get; set; } = string.Empty; public string ContentType { get; set; } = string.Empty; public bool IsNew { get; set; } public string PublishDate { get; set; } = string.Empty; public int CategoryId { get; set; } }
    public class MenuItemDto { public int MenuId { get; set; } public int ParentMenuId { get; set; } public string LinkName { get; set; } = string.Empty; public string LinkUrl { get; set; } = string.Empty; public string Target { get; set; } = string.Empty; public int SeqNo { get; set; } public List<MenuItemDto> Children { get; set; } = new(); }
    public class PopupDto { public string Header { get; set; } = string.Empty; public string Text { get; set; } = string.Empty; }

    // ── Search College ────────────────────────────────────────────────────────
    public class SearchCollegeMastersResponse
    {
        public List<DropdownItem> Courses       { get; set; } = new();
        public List<DropdownItem> Districts     { get; set; } = new();
        public List<DropdownItem> CourseStatuses{ get; set; } = new();
    }
    public class SearchCollegeRow
    {
        public string CollegeCode  { get; set; } = "";
        public string District     { get; set; } = "";
        public string CollegeName  { get; set; } = "";
        public string Course       { get; set; } = "";
        public string CourseStatus { get; set; } = "";
        public int    Intake       { get; set; }
    }
    public class SearchCollegeResponse
    {
        public bool   Success    { get; set; }
        public string Message    { get; set; } = "";
        public int    TotalCount { get; set; }
        public List<SearchCollegeRow> Colleges { get; set; } = new();
    }
    public class SearchCollegeRequest
    {
        public short CourseID       { get; set; }
        public int   DistrictID     { get; set; }
        public short CourseStatusID { get; set; }
    }

    // ── Allotment List ────────────────────────────────────────────────────────
    public class AllotmentListMastersResponse
    {
        public List<DropdownItem> Phases  { get; set; } = new();
        public List<DropdownItem> Courses { get; set; } = new();
    }
    public class CollegeDropdownItem
    {
        public string CollegeCode         { get; set; } = "";
        public string CollegeNameWithCode { get; set; } = "";
    }
    public class AllotmentCollegesResponse
    {
        public bool   Success  { get; set; }
        public string Message  { get; set; } = "";
        public List<CollegeDropdownItem> Colleges { get; set; } = new();
    }
    public class AllotmentListRow
    {
        public string MeritNo             { get; set; } = "";
        public string TotalWeightage      { get; set; } = "";
        public string ApplicationID       { get; set; } = "";
        public string CandidateName       { get; set; } = "";
        public string AllottedTypeDisplay { get; set; } = "";
    }
    public class AllotmentListRequest
    {
        public long  CollegeID { get; set; }
        public short PhaseID   { get; set; }
        public string CollegeName { get; set; } = "";
        public string CourseName  { get; set; } = "";
        public string PhaseName   { get; set; } = "";
    }
    public class AllotmentListResponse
    {
        public bool   Success    { get; set; }
        public string Message    { get; set; } = "";
        public int    TotalCount { get; set; }
        public List<AllotmentListRow> Rows { get; set; } = new();
    }
}
