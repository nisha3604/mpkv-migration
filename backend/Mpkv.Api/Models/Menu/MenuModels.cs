namespace Mpkv.Api.Models.Menu
{
    // ── GET /api/menu — returned to all logged-in navbars ─────────────────────
    // SP: Menu_GetMenu(@RegionID, @UserTypeID, @UserLoginID, @Language)
    public class MenuResponse
    {
        public bool             Success { get; set; }
        public string           Message { get; set; } = "";
        public List<MenuItem>   Items   { get; set; } = new();
    }

    public class MenuItem
    {
        public int    MenuID       { get; set; }
        public int    ParentMenuID { get; set; }
        public int    LinkID       { get; set; }
        public string LinkName     { get; set; } = "";
        public string LinkURL      { get; set; } = "";
        public string GroupName    { get; set; } = "";
        public string Target       { get; set; } = "";
        public int    SeqNo        { get; set; }
        public bool   IsNew        { get; set; }
    }

    // ── Admin: GET /api/admin/menu/list — management grid ─────────────────────
    // SP: Menu_GetMenusList(@RegionID, @UserTypeID, @ParentMenuID)
    public class AdminMenuListResponse
    {
        public bool                  Success { get; set; }
        public string                Message { get; set; } = "";
        public List<AdminMenuItem>   Items   { get; set; } = new();
    }

    public class AdminMenuItem
    {
        public int      MenuID               { get; set; }
        public int      UserTypeID           { get; set; }
        public int      ParentMenuID         { get; set; }
        public int      LinkID               { get; set; }
        public string   LinkName             { get; set; } = "";
        public string   LinkURL              { get; set; } = "";
        public string   GroupName            { get; set; } = "";
        public string   Target               { get; set; } = "";
        public int      SeqNo                { get; set; }
        public bool     IsNew                { get; set; }
        public bool     IsActive             { get; set; }
        public string   DisplayStartDateTime { get; set; } = "";
        public string   DisplayEndDateTime   { get; set; } = "";
    }

    // ── Admin: GET /api/admin/menu/:id — single menu for edit ─────────────────
    // SP: Menu_GetMenuDetails(@MenuID)
    public class AdminMenuDetailResponse
    {
        public bool          Success { get; set; }
        public string        Message { get; set; } = "";
        public AdminMenuItem? Item   { get; set; }
    }

    // ── Admin: POST /api/admin/menu — add/edit ─────────────────────────────────
    // SP: Menu_SaveMenuDetails (12 params)
    public class SaveMenuRequest
    {
        public int    MenuID               { get; set; }  // 0 = new
        public int    UserTypeID           { get; set; }
        public int    ParentMenuID         { get; set; }
        public int    LinkID               { get; set; }
        public string DisplayStartDateTime { get; set; } = "";
        public string DisplayEndDateTime   { get; set; } = "";
        public string Target               { get; set; } = "";
        public bool   IsNew                { get; set; }
        public bool   IsActive             { get; set; } = true;
    }

    public class SaveMenuResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public int    MenuID  { get; set; }
    }

    // ── Admin: POST /api/admin/menu/reorder — bulk SeqNo + IsActive update ─────
    // SP: Menu_SaveMenusActiveStatus(@MenusXML)
    public class ReorderMenuRequest
    {
        public List<ReorderMenuItem> Items { get; set; } = new();
    }

    public class ReorderMenuItem
    {
        public int  MenuID   { get; set; }
        public int  SeqNo    { get; set; }
        public bool IsActive { get; set; }
    }

    // ── Admin: GET /api/admin/menu/links — available links picker ─────────────
    // SP: Menu_GetLinksList(@Directory)  +  Menu_GetAvailableMenusList
    public class LinkListResponse
    {
        public bool            Success { get; set; }
        public string          Message { get; set; } = "";
        public List<LinkItem>  Items   { get; set; } = new();
    }

    public class LinkItem
    {
        public int    LinkID               { get; set; }
        public string LinkName             { get; set; } = "";
        public string LinkNameMarathi      { get; set; } = "";
        public string LinkDescription      { get; set; } = "";
        public string LinkURL              { get; set; } = "";
        public string LinkType             { get; set; } = "";
        public string Directory            { get; set; } = "";
        public bool   IsActive             { get; set; }
    }

    // ── Admin: GET /api/admin/menu/links/:id — single link ────────────────────
    // SP: Menu_GetLinkDetails(@LinkID)
    public class LinkDetailResponse
    {
        public bool      Success { get; set; }
        public string    Message { get; set; } = "";
        public LinkItem? Item    { get; set; }
    }

    // ── Admin: POST /api/admin/menu/links — add/edit link ─────────────────────
    // SP: Menu_SaveLinkDetails (13 params)
    public class SaveLinkRequest
    {
        public int    LinkID               { get; set; }  // 0 = new
        public string LinkName             { get; set; } = "";
        public string LinkNameMarathi      { get; set; } = "";
        public string LinkDescription      { get; set; } = "";
        public string LinkDescriptionMarathi{ get; set; }= "";
        public string LinkURL              { get; set; } = "";
        public string LinkType             { get; set; } = "P";  // P=page, G=group
        public string Directory            { get; set; } = "";
        public string PageName             { get; set; } = "";
        public string QueryString          { get; set; } = "";
        public bool   IsActive             { get; set; } = true;
    }

    // ── Admin: GET /api/admin/menu/groups — parent group picker ───────────────
    // SP: Menu_GetGroupsList(@RegionID, @UserTypeID)
    public class GroupListResponse
    {
        public bool              Success { get; set; }
        public string            Message { get; set; } = "";
        public List<AdminMenuItem> Items { get; set; } = new();
    }

    // ── Admin: GET /api/admin/menu/available — links not yet assigned ──────────
    // SP: Menu_GetAvailableMenusList(@RegionID, @UserTypeID, @ParentMenuID)
    public class AvailableLinksResponse
    {
        public bool            Success { get; set; }
        public string          Message { get; set; } = "";
        public List<LinkItem>  Items   { get; set; } = new();
    }
}
