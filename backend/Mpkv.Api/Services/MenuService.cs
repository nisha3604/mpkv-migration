using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.Menu;

namespace Mpkv.Api.Services
{
    public interface IMenuService
    {
        // Navigation — called by all navbars
        MenuResponse GetMenu(short regionId, int userTypeId, string userLoginId, string language = "");

        // Admin management
        AdminMenuListResponse   GetMenusList(short regionId, int userTypeId, int parentMenuId);
        AdminMenuDetailResponse GetMenuDetails(int menuId);
        SaveMenuResponse        SaveMenuDetails(short regionId, SaveMenuRequest req, string userLoginId, string ipAddress);
        SaveMenuResponse        DeleteMenu(int menuId, string userLoginId, string ipAddress);
        SaveMenuResponse        ReorderMenus(ReorderMenuRequest req, string userLoginId, string ipAddress);

        // Link management
        LinkListResponse        GetLinksList(string directory);
        LinkDetailResponse      GetLinkDetails(int linkId);
        SaveMenuResponse        SaveLinkDetails(SaveLinkRequest req, string userLoginId, string ipAddress);
        GroupListResponse       GetGroupsList(short regionId, int userTypeId);
        AvailableLinksResponse  GetAvailableLinks(short regionId, int userTypeId, int parentMenuId);
    }

    /// <summary>
    /// Mirrors Menu/MenuHome.aspx in old project.
    /// Two tables: Menu_MasterMenus (placement) + Menu_MasterLinks (link content).
    /// Menu_GetMenu filters by RegionID + UserTypeID + IsActive + date window.
    /// For candidate (91): GroupName logic removes ApplicationFormBeforeLock/AfterLock based on IsConfirmed.
    /// </summary>
    public class MenuService : IMenuService
    {
        private readonly DbAccess _db;
        private const short REGION_ID = 1;  // single region project

        public MenuService(DbAccess db) => _db = db;

        // ── GET MENU — for navbars ─────────────────────────────────────────────
        public MenuResponse GetMenu(short regionId, int userTypeId, string userLoginId, string language = "")
        {
            var r = new MenuResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@RegionID",    regionId);
                p.Add("@UserTypeID",  userTypeId);
                p.Add("@UserLoginID", userLoginId);
                p.Add("@Language",    language ?? "");
                var dt = _db.GetDataTable("Menu_GetMenu", p);
                if (dt == null) { r.Success = true; return r; }

                bool HC(string n) => dt.Columns.Contains(n);
                foreach (System.Data.DataRow row in dt.Rows)
                {
                    r.Items.Add(new MenuItem
                    {
                        MenuID       = HC("MenuID")       && row["MenuID"]       != DBNull.Value ? Convert.ToInt32(row["MenuID"])       : 0,
                        ParentMenuID = HC("ParentMenuID") && row["ParentMenuID"] != DBNull.Value ? Convert.ToInt32(row["ParentMenuID"]) : 0,
                        LinkID       = HC("LinkID")       && row["LinkID"]       != DBNull.Value ? Convert.ToInt32(row["LinkID"])       : 0,
                        LinkName     = HC("LinkName")     ? row["LinkName"]?.ToString()     ?? "" : "",
                        LinkURL      = HC("LinkURL")      ? row["LinkURL"]?.ToString()      ?? "" : "",
                        GroupName    = HC("GroupName")    ? row["GroupName"]?.ToString()    ?? "" : "",
                        Target       = HC("Target")       ? row["Target"]?.ToString()       ?? "" : "",
                        SeqNo        = HC("SeqNo")        && row["SeqNo"]        != DBNull.Value ? Convert.ToInt32(row["SeqNo"])        : 0,
                        IsNew        = HC("IsNew")        && row["IsNew"]        != DBNull.Value && Convert.ToBoolean(row["IsNew"]),
                    });
                }
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── ADMIN: LIST menus ──────────────────────────────────────────────────
        public AdminMenuListResponse GetMenusList(short regionId, int userTypeId, int parentMenuId)
        {
            var r = new AdminMenuListResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@RegionID",    regionId);
                p.Add("@UserTypeID",  userTypeId);
                p.Add("@ParentMenuID",parentMenuId);
                var dt = _db.GetDataTable("Menu_GetMenusList", p);
                if (dt == null) { r.Success = true; return r; }
                bool HC(string n) => dt.Columns.Contains(n);
                foreach (System.Data.DataRow row in dt.Rows)
                    r.Items.Add(MapAdminItem(row, HC));
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── ADMIN: GET single menu ─────────────────────────────────────────────
        public AdminMenuDetailResponse GetMenuDetails(int menuId)
        {
            var r = new AdminMenuDetailResponse();
            try
            {
                var p = new DynamicParameters(); p.Add("@MenuID", menuId);
                var dt = _db.GetDataTable("Menu_GetMenuDetails", p);
                if (dt == null || dt.Rows.Count == 0) { r.Success = true; return r; }
                bool HC(string n) => dt.Columns.Contains(n);
                r.Item = MapAdminItem(dt.Rows[0], HC);
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── ADMIN: SAVE (add/edit) menu ────────────────────────────────────────
        public SaveMenuResponse SaveMenuDetails(short regionId, SaveMenuRequest req, string userLoginId, string ipAddress)
        {
            try
            {
                DateTime startDt = DateTime.TryParse(req.DisplayStartDateTime, out var s) ? s : DateTime.Now;
                DateTime endDt   = DateTime.TryParse(req.DisplayEndDateTime,   out var e) ? e : DateTime.Now.AddYears(10);

                var p = new DynamicParameters();
                p.Add("@MenuID",               req.MenuID);
                p.Add("@UserTypeID",           req.UserTypeID);
                p.Add("@ParentMenuID",         req.ParentMenuID);
                p.Add("@LinkID",               req.LinkID);
                p.Add("@DisplayStartDateTime", startDt);
                p.Add("@DisplayEndDateTime",   endDt);
                p.Add("@Target",               req.Target ?? "");
                p.Add("@IsNew",                req.IsNew);
                p.Add("@IsActive",             req.IsActive);
                p.Add("@RegionID",             regionId);
                p.Add("@UserLoginID",          userLoginId);
                p.Add("@IPAddress",            ipAddress);

                var result = _db.ExecuteScalar("Menu_SaveMenuDetails", p)?.ToString() ?? "";
                // SP returns new MenuID on insert, "Y" on update, error string otherwise
                if (result.ToUpper() == "Y")
                    return new SaveMenuResponse { Success = true, Message = "Menu saved successfully.", MenuID = req.MenuID };
                if (int.TryParse(result, out var newMenuId) && newMenuId > 0)
                    return new SaveMenuResponse { Success = true, Message = "Menu saved successfully.", MenuID = newMenuId };
                return new SaveMenuResponse { Success = false, Message = result.Length > 0 ? result : "Failed to save menu." };
            }
            catch (Exception ex) { return new SaveMenuResponse { Success = false, Message = ex.Message }; }
        }

        // ── ADMIN: DELETE menu ─────────────────────────────────────────────────
        // Old project deactivates rather than hard-deletes — set IsActive=false via SaveMenuDetails
        public SaveMenuResponse DeleteMenu(int menuId, string userLoginId, string ipAddress)
        {
            try
            {
                // Get existing then set IsActive=false
                var detail = GetMenuDetails(menuId);
                if (detail.Item == null) return new SaveMenuResponse { Success = false, Message = "Menu not found." };

                var req = new SaveMenuRequest
                {
                    MenuID               = menuId,
                    UserTypeID           = detail.Item.UserTypeID,
                    ParentMenuID         = detail.Item.ParentMenuID,
                    LinkID               = detail.Item.LinkID,
                    DisplayStartDateTime = detail.Item.DisplayStartDateTime,
                    DisplayEndDateTime   = detail.Item.DisplayEndDateTime,
                    Target               = detail.Item.Target,
                    IsNew                = detail.Item.IsNew,
                    IsActive             = false,
                };
                return SaveMenuDetails(REGION_ID, req, userLoginId, ipAddress);
            }
            catch (Exception ex) { return new SaveMenuResponse { Success = false, Message = ex.Message }; }
        }

        // ── ADMIN: REORDER (bulk SeqNo + IsActive) ─────────────────────────────
        public SaveMenuResponse ReorderMenus(ReorderMenuRequest req, string userLoginId, string ipAddress)
        {
            try
            {
                // Build XML matching old project ArrayOfMenuEntity format
                var xml = new System.Text.StringBuilder();
                xml.Append("<?xml version=\"1.0\" encoding=\"utf-16\"?>");
                xml.Append("<ArrayOfMenuEntity xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">");
                foreach (var item in req.Items)
                {
                    xml.Append("<MenuEntity>");
                    xml.Append($"<MenuID>{item.MenuID}</MenuID>");
                    xml.Append($"<SeqNo>{item.SeqNo}</SeqNo>");
                    xml.Append($"<IsActive>{(item.IsActive ? 1 : 0)}</IsActive>");
                    xml.Append($"<UserLoginID>{System.Security.SecurityElement.Escape(userLoginId)}</UserLoginID>");
                    xml.Append($"<IPAddress>{System.Security.SecurityElement.Escape(ipAddress)}</IPAddress>");
                    xml.Append("</MenuEntity>");
                }
                xml.Append("</ArrayOfMenuEntity>");

                var p = new DynamicParameters();
                p.Add("@MenusXML", xml.ToString());
                var result = _db.ExecuteScalar("Menu_SaveMenusActiveStatus", p)?.ToString() ?? "";
                if (result.ToUpper() == "Y" || result == "1")
                    return new SaveMenuResponse { Success = true, Message = "Menu order saved." };
                return new SaveMenuResponse { Success = false, Message = result.Length > 0 ? result : "Failed." };
            }
            catch (Exception ex) { return new SaveMenuResponse { Success = false, Message = ex.Message }; }
        }

        // ── LINKS: list by directory ───────────────────────────────────────────
        public LinkListResponse GetLinksList(string directory)
        {
            var r = new LinkListResponse();
            try
            {
                var p = new DynamicParameters(); p.Add("@Directory", directory ?? "");
                var dt = _db.GetDataTable("Menu_GetLinksList", p);
                if (dt != null) foreach (System.Data.DataRow row in dt.Rows) r.Items.Add(MapLink(row, dt));
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── LINKS: single link ─────────────────────────────────────────────────
        public LinkDetailResponse GetLinkDetails(int linkId)
        {
            var r = new LinkDetailResponse();
            try
            {
                var p = new DynamicParameters(); p.Add("@LinkID", linkId);
                var dt = _db.GetDataTable("Menu_GetLinkDetails", p);
                if (dt != null && dt.Rows.Count > 0) r.Item = MapLink(dt.Rows[0], dt);
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── LINKS: save (add/edit) ─────────────────────────────────────────────
        public SaveMenuResponse SaveLinkDetails(SaveLinkRequest req, string userLoginId, string ipAddress)
        {
            try
            {
                var p = new DynamicParameters();
                p.Add("@LinkID",                  req.LinkID);
                p.Add("@LinkName",                req.LinkName);
                p.Add("@LinkNameMarathi",         req.LinkNameMarathi ?? "");
                p.Add("@LinkDescription",         req.LinkDescription ?? "");
                p.Add("@LinkDescriptionMarathi",  req.LinkDescriptionMarathi ?? "");
                p.Add("@LinkURL",                 req.LinkURL);
                p.Add("@LinkType",                req.LinkType ?? "P");
                p.Add("@Directory",               req.Directory ?? "");
                p.Add("@PageName",                req.PageName ?? "");
                p.Add("@QueryString",             req.QueryString ?? "");
                p.Add("@IsActive",                req.IsActive);
                p.Add("@UserLoginID",             userLoginId);
                p.Add("@IPAddress",               ipAddress);
                var result = _db.ExecuteScalar("Menu_SaveLinkDetails", p)?.ToString() ?? "";
                if (result.ToUpper() == "Y")
                    return new SaveMenuResponse { Success = true, Message = "Link saved successfully.", MenuID = req.LinkID };
                if (int.TryParse(result, out var newLinkId) && newLinkId > 0)
                    return new SaveMenuResponse { Success = true, Message = "Link saved successfully.", MenuID = newLinkId };
                return new SaveMenuResponse { Success = false, Message = result.Length > 0 ? result : "Failed to save link." };
            }
            catch (Exception ex) { return new SaveMenuResponse { Success = false, Message = ex.Message }; }
        }

        // ── GROUPS: parent-level items for dropdown ────────────────────────────
        public GroupListResponse GetGroupsList(short regionId, int userTypeId)
        {
            var r = new GroupListResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@RegionID",   regionId);
                p.Add("@UserTypeID", userTypeId);
                var dt = _db.GetDataTable("Menu_GetGroupsList", p);
                if (dt != null)
                {
                    bool HC(string n) => dt.Columns.Contains(n);
                    foreach (System.Data.DataRow row in dt.Rows) r.Items.Add(MapAdminItem(row, HC));
                }
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── AVAILABLE LINKS: not yet assigned to this parent ──────────────────
        public AvailableLinksResponse GetAvailableLinks(short regionId, int userTypeId, int parentMenuId)
        {
            var r = new AvailableLinksResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@RegionID",    regionId);
                p.Add("@UserTypeID",  userTypeId);
                p.Add("@ParentMenuID",parentMenuId);
                var dt = _db.GetDataTable("Menu_GetAvailableMenusList", p);
                if (dt != null) foreach (System.Data.DataRow row in dt.Rows)
                {
                    bool HC(string n) => dt.Columns.Contains(n);
                    r.Items.Add(new LinkItem
                    {
                        LinkID   = HC("LinkID")   && row["LinkID"] != DBNull.Value ? Convert.ToInt32(row["LinkID"]) : 0,
                        LinkName = HC("LinkName") ? row["LinkName"]?.ToString() ?? "" : "",
                    });
                }
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── Private helpers ───────────────────────────────────────────────────
        private static AdminMenuItem MapAdminItem(System.Data.DataRow row, Func<string, bool> HC) =>
            new()
            {
                MenuID               = HC("MenuID")               && row["MenuID"]               != DBNull.Value ? Convert.ToInt32(row["MenuID"])       : 0,
                UserTypeID           = HC("UserTypeID")           && row["UserTypeID"]           != DBNull.Value ? Convert.ToInt32(row["UserTypeID"])   : 0,
                ParentMenuID         = HC("ParentMenuID")         && row["ParentMenuID"]         != DBNull.Value ? Convert.ToInt32(row["ParentMenuID"]) : 0,
                LinkID               = HC("LinkID")               && row["LinkID"]               != DBNull.Value ? Convert.ToInt32(row["LinkID"])       : 0,
                LinkName             = HC("LinkName")             ? row["LinkName"]?.ToString()             ?? "" : "",
                LinkURL              = HC("LinkURL")              ? row["LinkURL"]?.ToString()              ?? "" : "",
                GroupName            = HC("GroupName")            ? row["GroupName"]?.ToString()            ?? "" : "",
                Target               = HC("Target")               ? row["Target"]?.ToString()               ?? "" : "",
                SeqNo                = HC("SeqNo")                && row["SeqNo"]                != DBNull.Value ? Convert.ToInt32(row["SeqNo"])         : 0,
                IsNew                = HC("IsNew")                && row["IsNew"]                != DBNull.Value && Convert.ToBoolean(row["IsNew"]),
                IsActive             = HC("IsActive")             && row["IsActive"]             != DBNull.Value && Convert.ToBoolean(row["IsActive"]),
                DisplayStartDateTime = HC("DisplayStartDateTime") && row["DisplayStartDateTime"] != DBNull.Value
                                           ? Convert.ToDateTime(row["DisplayStartDateTime"]).ToString("dd-MM-yyyy HH:mm") : "",
                DisplayEndDateTime   = HC("DisplayEndDateTime")   && row["DisplayEndDateTime"]   != DBNull.Value
                                           ? Convert.ToDateTime(row["DisplayEndDateTime"]).ToString("dd-MM-yyyy HH:mm") : "",
            };

        private static LinkItem MapLink(System.Data.DataRow row, System.Data.DataTable dt)
        {
            bool HC(string n) => dt.Columns.Contains(n);
            return new LinkItem
            {
                LinkID          = HC("LinkID")          && row["LinkID"]          != DBNull.Value ? Convert.ToInt32(row["LinkID"]) : 0,
                LinkName        = HC("LinkName")        ? row["LinkName"]?.ToString()        ?? "" : "",
                LinkNameMarathi = HC("LinkNameMarathi") ? row["LinkNameMarathi"]?.ToString() ?? "" : "",
                LinkDescription = HC("LinkDescription") ? row["LinkDescription"]?.ToString() ?? "" : "",
                LinkURL         = HC("LinkURL")         ? row["LinkURL"]?.ToString()         ?? "" : "",
                LinkType        = HC("LinkType")        ? row["LinkType"]?.ToString()        ?? "" : "",
                Directory       = HC("Directory")       ? row["Directory"]?.ToString()       ?? "" : "",
                IsActive        = HC("IsActive")        && row["IsActive"] != DBNull.Value && Convert.ToBoolean(row["IsActive"]),
            };
        }
    }
}
