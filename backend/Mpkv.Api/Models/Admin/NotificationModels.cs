namespace Mpkv.Api.Models.Admin
{
    // ── GET /api/admin/notifications ─────────────────────────────────────────
    public class NotificationListResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public List<NotificationItem> Items { get; set; } = new();
    }

    public class NotificationItem
    {
        public int    NotificationID         { get; set; }
        public int    NotificationCategoryID { get; set; }
        public string NotificationCategory   { get; set; } = "";
        public string NotificationTitle      { get; set; } = "";
        public string NotificationTitleMarathi{ get; set; } = "";
        public string DisplayStartDateTime   { get; set; } = "";
        public string DisplayEndDateTime     { get; set; } = "";
        public string PublishDateTime        { get; set; } = "";
        public string ContentType            { get; set; } = "";  // F=File, T=Text
        public string TextContent            { get; set; } = "";
        public string TextContentMarathi     { get; set; } = "";
        public string FileContentName        { get; set; } = "";
        public string FileContentURL         { get; set; } = "";
        public int    OpenInNewPage          { get; set; }
        public int    DisplayNewImage        { get; set; }
        public bool   IsActive               { get; set; }
    }

    // ── GET /api/admin/notifications/:id ─────────────────────────────────────
    public class NotificationDetailResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public NotificationItem? Item { get; set; }
    }

    // ── POST /api/admin/notifications ─────────────────────────────────────────
    // SP: Administration_SaveNotification (18 params)
    public class SaveNotificationRequest
    {
        public int    NotificationID          { get; set; }  // 0 = new
        public int    NotificationCategoryID  { get; set; }
        public string NotificationTitle       { get; set; } = "";
        public string NotificationTitleMarathi{ get; set; } = "";
        public string DisplayStartDateTime    { get; set; } = "";
        public string DisplayEndDateTime      { get; set; } = "";
        public string PublishDateTime         { get; set; } = "";
        public string ContentType             { get; set; } = "F";  // F or T
        public string TextContent             { get; set; } = "";
        public string TextContentMarathi      { get; set; } = "";
        public string FileContentName         { get; set; } = "";
        public string FileContentURL          { get; set; } = "";
        public int    OpenInNewPage           { get; set; }
        public int    DisplayNewImage         { get; set; }
        public bool   IsActive                { get; set; } = true;
    }

    public class SaveNotificationResponse
    {
        public bool   Success        { get; set; }
        public string Message        { get; set; } = "";
        public int    NotificationID { get; set; }
    }

    // ── Categories dropdown ───────────────────────────────────────────────────
    public class NotificationCategoriesResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public List<NotificationCategory> Categories { get; set; } = new();
    }

    public class NotificationCategory
    {
        public int    CategoryID   { get; set; }
        public string CategoryName { get; set; } = "";
    }
}
