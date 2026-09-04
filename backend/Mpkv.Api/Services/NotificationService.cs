using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.Admin;

namespace Mpkv.Api.Services
{
    public interface INotificationService
    {
        NotificationListResponse     GetList(short regionId);
        NotificationDetailResponse   GetDetails(int notificationId);
        NotificationCategoriesResponse GetCategories();
        SaveNotificationResponse     Save(short regionId, SaveNotificationRequest req,
                                          string userLoginId, string ipAddress);
        SaveNotificationResponse     Delete(int notificationId, string userLoginId, string ipAddress);
        // File upload — returns blob URL
        Task<string> UploadFile(IFormFile file, int categoryId);
    }

    /// <summary>
    /// Mirrors ManageNotifications.aspx.cs from old project.
    /// Table: Administration_NotificationDetails
    /// SPs: Administration_GetNotificationList, Administration_GetNotificationDetails,
    ///      Administration_SaveNotification, Administration_DeleteNotification
    /// </summary>
    public class NotificationService : INotificationService
    {
        private readonly DbAccess      _db;
        private readonly IConfiguration _config;
        private const short REGION_ID = 1;

        public NotificationService(DbAccess db, IConfiguration config)
        {
            _db     = db;
            _config = config;
        }

        // ── GET LIST ──────────────────────────────────────────────────────────
        public NotificationListResponse GetList(short regionId)
        {
            var r = new NotificationListResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@RegionID", regionId);
                var dt = _db.GetDataTable("Administration_GetNotificationList", p);
                if (dt == null) { r.Success = true; return r; }

                bool HC(string n) => dt.Columns.Contains(n);
                foreach (System.Data.DataRow row in dt.Rows)
                    r.Items.Add(MapItem(row, HC));
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── GET DETAILS ───────────────────────────────────────────────────────
        public NotificationDetailResponse GetDetails(int notificationId)
        {
            var r = new NotificationDetailResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@NotificationID", notificationId);
                var dt = _db.GetDataTable("Administration_GetNotificationDetails", p);
                if (dt == null || dt.Rows.Count == 0) { r.Success = true; return r; }
                bool HC(string n) => dt.Columns.Contains(n);
                r.Item    = MapItem(dt.Rows[0], HC);
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── GET CATEGORIES ────────────────────────────────────────────────────
        public NotificationCategoriesResponse GetCategories()
        {
            var r = new NotificationCategoriesResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@TableName",       "Master_NotificationCategory");
                p.Add("@DataValueField",  "NotificationCategoryID");
                p.Add("@DataTextField",   "NotificationCategory");
                p.Add("@ParentField",     "");
                p.Add("@ParentFieldValue","");
                p.Add("@OrderByFields",   "NotificationCategoryID");
                var dt = _db.GetDataTable("Base_GetMasterTableList", p);
                if (dt != null)
                    foreach (System.Data.DataRow row in dt.Rows)
                    {
                        var v = row[0]?.ToString() ?? "";
                        if (v == "-1") continue;
                        r.Categories.Add(new NotificationCategory
                        {
                            CategoryID   = int.TryParse(v, out var id) ? id : 0,
                            CategoryName = row[1]?.ToString() ?? "",
                        });
                    }
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── SAVE ──────────────────────────────────────────────────────────────
        public SaveNotificationResponse Save(short regionId, SaveNotificationRequest req,
                                             string userLoginId, string ipAddress)
        {
            try
            {
                // Parse dates — format "dd-MM-yyyy HH:mm" (old project format)
                var fmt = new[] { "dd-MM-yyyy HH:mm", "dd/MM/yyyy HH:mm", "yyyy-MM-ddTHH:mm",
                                  "MM/dd/yyyy HH:mm:ss", "dd/MM/yyyy HH:mm:ss" };
                if (!DateTime.TryParseExact(req.DisplayStartDateTime.Trim(), fmt,
                    System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.None, out var startDt))
                    return new SaveNotificationResponse { Success=false, Message="Invalid Display Start Date/Time format. Use dd-MM-yyyy HH:mm" };

                if (!DateTime.TryParseExact(req.DisplayEndDateTime.Trim(), fmt,
                    System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.None, out var endDt))
                    return new SaveNotificationResponse { Success=false, Message="Invalid Display End Date/Time format. Use dd-MM-yyyy HH:mm" };

                if (!DateTime.TryParseExact(req.PublishDateTime.Trim(), fmt,
                    System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.None, out var publishDt))
                    return new SaveNotificationResponse { Success=false, Message="Invalid Publish Date/Time format. Use dd-MM-yyyy HH:mm" };

                var p = new DynamicParameters();
                p.Add("@NotificationID",          req.NotificationID);
                p.Add("@NotificationCategoryID",  req.NotificationCategoryID);
                p.Add("@NotificationTitle",        req.NotificationTitle.Trim());
                p.Add("@NotificationTitleMarathi", req.NotificationTitleMarathi?.Trim() ?? "");
                p.Add("@DisplayStartDateTime",     startDt);
                p.Add("@DisplayEndDateTime",       endDt);
                p.Add("@PublishDateTime",          publishDt);
                p.Add("@ContentType",              req.ContentType);
                p.Add("@TextContent",              req.TextContent       ?? "");
                p.Add("@TextContentMarathi",       req.TextContentMarathi?? "");
                p.Add("@FileContentName",          req.FileContentName   ?? "");
                p.Add("@FileContentURL",           req.FileContentURL    ?? "");
                p.Add("@OpenInNewPage",            req.OpenInNewPage);
                p.Add("@DisplayNewImage",          req.DisplayNewImage);
                p.Add("@IsActive",                 req.IsActive ? (short)1 : (short)0);
                p.Add("@RegionID",                 regionId);
                p.Add("@UserLoginID",              userLoginId);
                p.Add("@IPAddress",                ipAddress);

                var result = _db.ExecuteScalar("Administration_SaveNotification", p)?.ToString() ?? "";
                if (result.ToUpper() == "Y")
                    return new SaveNotificationResponse { Success=true, Message="Notification saved successfully.", NotificationID=req.NotificationID };
                if (int.TryParse(result, out var newId) && newId > 0)
                    return new SaveNotificationResponse { Success=true, Message="Notification saved successfully.", NotificationID=newId };
                return new SaveNotificationResponse { Success=false, Message=result.Length>0?result:"Failed to save notification." };
            }
            catch (Exception ex) { return new SaveNotificationResponse { Success=false, Message=ex.Message }; }
        }

        // ── DELETE ────────────────────────────────────────────────────────────
        public SaveNotificationResponse Delete(int notificationId, string userLoginId, string ipAddress)
        {
            try
            {
                var p = new DynamicParameters();
                p.Add("@NotificationID", notificationId);
                p.Add("@UserLoginID",    userLoginId);
                p.Add("@IPAddress",      ipAddress);
                var result = _db.ExecuteScalar("Administration_DeleteNotification", p)?.ToString() ?? "";
                bool ok = result.ToUpper() == "Y" || result == "1";
                return new SaveNotificationResponse { Success=ok, Message=ok?"Notification deleted successfully.":result };
            }
            catch (Exception ex) { return new SaveNotificationResponse { Success=false, Message=ex.Message }; }
        }

        // ── FILE UPLOAD ───────────────────────────────────────────────────────
        public async Task<string> UploadFile(IFormFile file, int categoryId)
        {
            try
            {
                var ext      = System.IO.Path.GetExtension(file.FileName).ToLower();
                var guid     = Guid.NewGuid().ToString("N")[..8];
                var fileName = $"{categoryId}_{guid}{ext}";
                var folder   = System.IO.Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "notifications");
                Directory.CreateDirectory(folder);
                var path = System.IO.Path.Combine(folder, fileName);
                using var stream = new System.IO.FileStream(path, System.IO.FileMode.Create);
                await file.CopyToAsync(stream);
                return $"/uploads/notifications/{fileName}";
            }
            catch { return ""; }
        }

        // ── Map row ───────────────────────────────────────────────────────────
        private static NotificationItem MapItem(System.Data.DataRow row, Func<string,bool> HC) =>
            new()
            {
                NotificationID          = HC("NotificationID")          && row["NotificationID"]          != DBNull.Value ? Convert.ToInt32(row["NotificationID"])          : 0,
                NotificationCategoryID  = HC("NotificationCategoryID")  && row["NotificationCategoryID"]  != DBNull.Value ? Convert.ToInt32(row["NotificationCategoryID"])  : 0,
                NotificationCategory    = HC("NotificationCategory")    ? row["NotificationCategory"]?.ToString()     ?? "" : "",
                NotificationTitle       = HC("NotificationTitle")       ? row["NotificationTitle"]?.ToString()        ?? "" : "",
                NotificationTitleMarathi= HC("NotificationTitleMarathi")? row["NotificationTitleMarathi"]?.ToString() ?? "" : "",
                DisplayStartDateTime    = HC("DisplayStartDateTime")    && row["DisplayStartDateTime"] != DBNull.Value
                                            ? Convert.ToDateTime(row["DisplayStartDateTime"]).ToString("dd-MM-yyyy HH:mm") : "",
                DisplayEndDateTime      = HC("DisplayEndDateTime")      && row["DisplayEndDateTime"]   != DBNull.Value
                                            ? Convert.ToDateTime(row["DisplayEndDateTime"]).ToString("dd-MM-yyyy HH:mm")   : "",
                PublishDateTime         = HC("PublishDateTimeF")        ? row["PublishDateTimeF"]?.ToString()          ?? "" :
                                          HC("PublishDateTime")         ? row["PublishDateTime"]?.ToString()           ?? "" : "",
                ContentType             = HC("ContentType")             ? row["ContentType"]?.ToString()               ?? "" : "",
                TextContent             = HC("TextContent")             ? row["TextContent"]?.ToString()               ?? "" : "",
                TextContentMarathi      = HC("TextContentMarathi")      ? row["TextContentMarathi"]?.ToString()        ?? "" : "",
                FileContentName         = HC("FileContentName")         ? row["FileContentName"]?.ToString()           ?? "" : "",
                FileContentURL          = HC("FileContentURL")          ? row["FileContentURL"]?.ToString()            ?? "" : "",
                OpenInNewPage           = HC("OpenInNewPage")           && row["OpenInNewPage"]   != DBNull.Value ? Convert.ToInt32(row["OpenInNewPage"])   : 0,
                DisplayNewImage         = HC("DisplayNewImage")         && row["DisplayNewImage"] != DBNull.Value ? Convert.ToInt32(row["DisplayNewImage"]) : 0,
                IsActive                = HC("IsActive")                && row["IsActive"]        != DBNull.Value && Convert.ToBoolean(row["IsActive"]),
            };
    }
}
