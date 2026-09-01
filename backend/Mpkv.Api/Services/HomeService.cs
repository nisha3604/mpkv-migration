using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.Candidate;

namespace Mpkv.Api.Services
{
    public interface IHomeService {
        HomePageResponse GetHomePageData(short regionId = 1);
        SearchCollegeMastersResponse GetSearchCollegeMasters();
        SearchCollegeResponse SearchCollege(short courseId, int districtId, short courseStatusId);
        // Allotment List
        AllotmentListMastersResponse GetAllotmentListMasters();
        AllotmentCollegesResponse    GetAllotmentColleges(short courseId);
        AllotmentListResponse        GetAllotmentList(long collegeId, short phaseId);
    }

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

        // ══════════════════════════════════════════════════════════════════════
        // SEARCH COLLEGE MASTERS
        // GET /api/home/search-college/masters
        // SPs: Base_GetMasterCourse, Base_GetMasterCollegeDistrict, Base_GetMasterTableList(Master_CourseStatus)
        // ══════════════════════════════════════════════════════════════════════
        public SearchCollegeMastersResponse GetSearchCollegeMasters()
        {
            var r = new SearchCollegeMastersResponse();
            try
            {
                // Courses
                var dt = _db.GetDataTable("Base_GetMasterCourse");
                if (dt != null) foreach (System.Data.DataRow row in dt.Rows) { var v = row[0]?.ToString() ?? ""; if (v != "-1") r.Courses.Add(new DropdownItem { Value = v, Text = row[1]?.ToString() ?? "" }); }
            } catch { }
            try
            {
                // College Districts
                var dt = _db.GetDataTable("Base_GetMasterCollegeDistrict");
                if (dt != null) foreach (System.Data.DataRow row in dt.Rows) { var v = row[0]?.ToString() ?? ""; if (v != "-1") r.Districts.Add(new DropdownItem { Value = v, Text = row[1]?.ToString() ?? "" }); }
            } catch { }
            try
            {
                // Course Status
                var p = new DynamicParameters();
                p.Add("@TableName","Master_CourseStatus"); p.Add("@DataValueField","CourseStatusID"); p.Add("@DataTextField","CourseStatus"); p.Add("@ParentField",""); p.Add("@ParentFieldValue",""); p.Add("@OrderByFields","CourseStatusID");
                var dt = _db.GetDataTable("Base_GetMasterTableList", p);
                if (dt != null) foreach (System.Data.DataRow row in dt.Rows) { var v = row[0]?.ToString() ?? ""; if (v != "-1") r.CourseStatuses.Add(new DropdownItem { Value = v, Text = row[1]?.ToString() ?? "" }); }
            } catch { }
            return r;
        }

        // ══════════════════════════════════════════════════════════════════════
        // SEARCH COLLEGE
        // POST /api/home/search-college
        // SP: College_SearchCollege(@CourseID, @DistrictID, @CourseStatusID)
        // ══════════════════════════════════════════════════════════════════════
        public SearchCollegeResponse SearchCollege(short courseId, int districtId, short courseStatusId)
        {
            var r = new SearchCollegeResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@CourseID",       courseId);
                p.Add("@DistrictID",     districtId);
                p.Add("@CourseStatusID", courseStatusId);
                var dt = _db.GetDataTable("College_SearchCollege", p);
                if (dt != null)
                {
                    bool HC(string n) => dt.Columns.Contains(n);
                    foreach (System.Data.DataRow row in dt.Rows)
                        r.Colleges.Add(new SearchCollegeRow
                        {
                            CollegeCode   = HC("CollegeCode")   ? row["CollegeCode"]?.ToString()   ?? "" : "",
                            District      = HC("District")      ? row["District"]?.ToString()      ?? "" : "",
                            CollegeName   = HC("CollegeName")   ? row["CollegeName"]?.ToString()   ?? "" : "",
                            Course        = HC("Course")        ? row["Course"]?.ToString()        ?? "" : "",
                            CourseStatus  = HC("CourseStatus")  ? row["CourseStatus"]?.ToString()  ?? "" : "",
                            Intake        = HC("Intake")        && row["Intake"] != DBNull.Value ? Convert.ToInt32(row["Intake"]) : 0,
                        });
                    r.Success = true;
                    r.TotalCount = r.Colleges.Count;
                }
            }
            catch (Exception ex) { r.Message = ex.Message; }
            return r;
        }
        // ══════════════════════════════════════════════════════════════════════
        // ALLOTMENT LIST MASTERS
        // GET /api/home/allotment-list/masters
        // Returns phases (Admission_GetPhaseList) + courses (Base_GetMasterCourse)
        // ══════════════════════════════════════════════════════════════════════
        public AllotmentListMastersResponse GetAllotmentListMasters()
        {
            var r = new AllotmentListMastersResponse();
            try
            {
                // Phases
                var pp = new DynamicParameters();
                pp.Add("@UserTypeID",  0);
                pp.Add("@Flag",        "AllotmentDisplay");
                pp.Add("@UserLoginID", "");
                var pDt = _db.GetDataTable("Admission_GetPhaseList", pp);
                if (pDt != null) foreach (System.Data.DataRow row in pDt.Rows) { var v = row[0]?.ToString() ?? ""; if (v != "-1") r.Phases.Add(new DropdownItem { Value = v, Text = row[1]?.ToString() ?? "" }); }
            } catch { }
            try
            {
                // Courses
                var dt = _db.GetDataTable("Base_GetMasterCourse");
                if (dt != null) foreach (System.Data.DataRow row in dt.Rows) { var v = row[0]?.ToString() ?? ""; if (v != "-1") r.Courses.Add(new DropdownItem { Value = v, Text = row[1]?.ToString() ?? "" }); }
            } catch { }
            return r;
        }

        // ══════════════════════════════════════════════════════════════════════
        // GET COLLEGES BY COURSE (cascade)
        // POST /api/home/allotment-list/colleges
        // SP: College_GetCollegeList(@CourseID, @DistrictID=0, @CollegeCode='', @CollegeName='')
        // ══════════════════════════════════════════════════════════════════════
        public AllotmentCollegesResponse GetAllotmentColleges(short courseId)
        {
            var r = new AllotmentCollegesResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@CourseID",    courseId);
                p.Add("@DistrictID",  0);
                p.Add("@CollegeCode", "");
                p.Add("@CollegeName", "");
                var dt = _db.GetDataTable("College_GetCollegeList", p);
                if (dt != null)
                    foreach (System.Data.DataRow row in dt.Rows)
                        r.Colleges.Add(new CollegeDropdownItem
                        {
                            CollegeCode           = row["CollegeCode"]?.ToString()           ?? "",
                            CollegeNameWithCode   = row["CollegeNameWithCode"]?.ToString()   ?? "",
                        });
                r.Success = true;
            }
            catch (Exception ex) { r.Message = ex.Message; }
            return r;
        }

        // ══════════════════════════════════════════════════════════════════════
        // GET ALLOTMENT LIST
        // POST /api/home/allotment-list
        // SP: Report_GetAllotmentReport(@CollegeID, @PhaseID, @Flag='Allotment')
        // Returns: MeritNo, TotalWeightage, ApplicationID, CandidateName, AllottedTypeDisplay
        // Header rows: college name + course name (for display above table)
        // ══════════════════════════════════════════════════════════════════════
        public AllotmentListResponse GetAllotmentList(long collegeId, short phaseId)
        {
            var r = new AllotmentListResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@CollegeID", collegeId);
                p.Add("@PhaseID",   phaseId);
                p.Add("@Flag",      "Allotment");
                var dt = _db.GetDataTable("Report_GetAllotmentReport", p);
                if (dt != null)
                {
                    bool HC(string n) => dt.Columns.Contains(n);
                    foreach (System.Data.DataRow row in dt.Rows)
                        r.Rows.Add(new AllotmentListRow
                        {
                            MeritNo            = HC("MeritNo")            ? row["MeritNo"]?.ToString()            ?? "" : "",
                            TotalWeightage     = HC("TotalWeightage")     ? row["TotalWeightage"]?.ToString()     ?? "" : "",
                            ApplicationID      = HC("ApplicationID")      ? row["ApplicationID"]?.ToString()      ?? "" : "",
                            CandidateName      = HC("CandidateName")      ? row["CandidateName"]?.ToString()      ?? "" : "",
                            AllottedTypeDisplay= HC("AllottedTypeDisplay") ? row["AllottedTypeDisplay"]?.ToString() ?? "" : "",
                        });
                    r.TotalCount = r.Rows.Count;
                    r.Success = true;
                }
            }
            catch (Exception ex) { r.Message = ex.Message; }
            return r;
        }
    }
}
