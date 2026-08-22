using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.Candidate;

namespace Mpkv.Api.Services
{
    public interface IHomeService { HomePageResponse GetHomePageData(short regionId = 1); }

    public class HomeService : IHomeService
    {
        private readonly DbAccess _db;
        private readonly IConfiguration _config;
        public HomeService(DbAccess db, IConfiguration config) { _db = db; _config = config; }

        public HomePageResponse GetHomePageData(short regionId = 1)
        {
            var r = new HomePageResponse { WebsiteHeader = _config["AppSettings:WebsiteHeader"] ?? "Online Agriculture Diploma Admissions - 2026", HelplineMobileNo = _config["AppSettings:HelplineMobileNo"] ?? "+91-8806612998" };
            try { var result = _db.ExecuteScalar("Base_IsNewCandidateRegistrationStarted"); r.IsRegistrationOpen = result != null && Convert.ToBoolean(result); } catch { r.IsRegistrationOpen = false; }
            try { var mp = new DynamicParameters(); mp.Add("@RegionID", regionId); mp.Add("@UserTypeID", 0); mp.Add("@UserLoginID",""); mp.Add("@Language",""); var menuDt = _db.GetDataTable("Menu_GetMenu", mp); var allMenus = new List<MenuItemDto>(); if (menuDt != null) foreach (System.Data.DataRow row in menuDt.Rows) allMenus.Add(new MenuItemDto { MenuId = Convert.ToInt32(row["MenuID"]), ParentMenuId = Convert.ToInt32(row["ParentMenuID"]), LinkName = row["LinkName"]?.ToString() ?? "", LinkUrl = row["LinkURL"]?.ToString() ?? "", Target = row["Target"]?.ToString() ?? "", SeqNo = Convert.ToInt32(row["SeqNo"]) }); var parents = allMenus.Where(m => m.ParentMenuId == 0).OrderBy(m => m.SeqNo).ToList(); foreach (var parent in parents) parent.Children = allMenus.Where(m => m.ParentMenuId == parent.MenuId).OrderBy(m => m.SeqNo).ToList(); r.MenuItems = parents; } catch { }
            try { var np = new DynamicParameters(); np.Add("@RegionID", regionId); np.Add("@Language",""); var notifDt = _db.GetDataTable("Administration_GetNotificationListForDisplay", np); if (notifDt != null) { bool popupSet = false; foreach (System.Data.DataRow row in notifDt.Rows) { int categoryId = Convert.ToInt32(row["NotificationCategoryID"]); bool isNew = Convert.ToInt16(row["DisplayNewImage"]) == 1; string publishDate = ""; if (notifDt.Columns.Contains("PublishDateTime") && row["PublishDateTime"] != DBNull.Value) publishDate = Convert.ToDateTime(row["PublishDateTime"]).ToString("dd MMM yyyy"); var dto = new NotificationDto { Title = row["NotificationTitle"]?.ToString() ?? "", TextContent = row["TextContent"]?.ToString() ?? "", FileContentUrl = row["FileContentURL"]?.ToString() ?? "", ContentType = row["ContentType"]?.ToString() ?? "T", IsNew = isNew, PublishDate = publishDate, CategoryId = categoryId }; switch (categoryId) { case 1: r.Announcements.Add(dto); break; case 2: r.News.Add(dto); break; case 3: r.Notifications.Add(dto); break; case 4: r.Downloads.Add(dto); break; case 11: if (!popupSet) { r.Popup = new PopupDto { Header = dto.Title, Text = dto.TextContent }; popupSet = true; } break; } } } } catch (Exception ex) { Console.WriteLine($"GetHomePageData notifications error: {ex.Message}"); }
            return r;
        }
    }
}
