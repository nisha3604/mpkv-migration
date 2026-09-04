using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.Admin;

namespace Mpkv.Api.Services
{
    public interface IActivityStatusService
    {
        ActivityStatusListResponse    GetList(short regionId);
        ActivityStatusItem?           GetDetails(short regionId, string activityName);
        SaveActivityStatusResponse    Save(short regionId, SaveActivityStatusRequest req, string modifiedBy, string ipAddress);
        AdmissionActivityListResponse GetAdmissionList();
        AdmissionActivityItem?        GetAdmissionDetails(short phaseId);
        SaveActivityStatusResponse    SaveAdmission(SaveAdmissionActivityRequest req, string modifiedBy, string ipAddress);
    }

    /// <summary>
    /// Mirrors ManageActivityStatus.aspx + ManageAdmissionActivityStatus.aspx
    /// SPs: Administration_GetActivityStatusList / Details / Save
    ///      Administration_GetAdmissionActivityStatusList / Details / Save
    /// </summary>
    public class ActivityStatusService : IActivityStatusService
    {
        private readonly DbAccess _db;
        public ActivityStatusService(DbAccess db) => _db = db;

        private static readonly string[] DATE_FMTS =
            { "dd-MM-yyyy HH:mm", "dd/MM/yyyy HH:mm", "dd-MM-yyyy HH:mm:ss",
              "dd/MM/yyyy HH:mm:ss", "MM/dd/yyyy HH:mm:ss", "yyyy-MM-ddTHH:mm" };

        // ── ACTIVITY STATUS ───────────────────────────────────────────────────
        public ActivityStatusListResponse GetList(short regionId)
        {
            var r = new ActivityStatusListResponse();
            try
            {
                var p = new DynamicParameters(); p.Add("@RegionID", regionId);
                var dt = _db.GetDataTable("Administration_GetActivityStatusList", p);
                if (dt == null) { r.Success = true; return r; }
                bool HC(string n) => dt.Columns.Contains(n);
                foreach (System.Data.DataRow row in dt.Rows)
                    r.Items.Add(MapActivity(row, HC));
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        public ActivityStatusItem? GetDetails(short regionId, string activityName)
        {
            try
            {
                var p = new DynamicParameters();
                p.Add("@RegionID", regionId); p.Add("@ActivityName", activityName);
                var dt = _db.GetDataTable("Administration_GetActivityStatusDetails", p);
                if (dt == null || dt.Rows.Count == 0) return null;
                bool HC(string n) => dt.Columns.Contains(n);
                return MapActivity(dt.Rows[0], HC);
            }
            catch { return null; }
        }

        public SaveActivityStatusResponse Save(short regionId, SaveActivityStatusRequest req,
                                               string modifiedBy, string ipAddress)
        {
            try
            {
                if (!DateTime.TryParseExact(req.ActivityStartDateTime.Trim(), DATE_FMTS,
                    System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.None, out var startDt))
                    return new SaveActivityStatusResponse { Success=false, Message="Invalid Start DateTime. Use dd-MM-yyyy HH:mm" };

                if (!DateTime.TryParseExact(req.ActivityEndDateTime.Trim(), DATE_FMTS,
                    System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.None, out var endDt))
                    return new SaveActivityStatusResponse { Success=false, Message="Invalid End DateTime. Use dd-MM-yyyy HH:mm" };

                var p = new DynamicParameters();
                p.Add("@RegionID",            regionId);
                p.Add("@ActivityName",         req.ActivityName);
                p.Add("@ActivityStartDateTime",startDt);
                p.Add("@ActivityEndDateTime",  endDt);
                p.Add("@ModifiedBy",           modifiedBy);
                p.Add("@ModifiedByIPAddress",  ipAddress);
                var result = _db.ExecuteScalar("Administration_SaveActivityStatusDetails", p)?.ToString() ?? "";
                bool ok = result.ToUpper() == "Y" || result == "1";
                return new SaveActivityStatusResponse { Success=ok, Message=ok?"Activity status saved successfully.":result };
            }
            catch (Exception ex) { return new SaveActivityStatusResponse { Success=false, Message=ex.Message }; }
        }

        // ── ADMISSION ACTIVITY STATUS ─────────────────────────────────────────
        public AdmissionActivityListResponse GetAdmissionList()
        {
            var r = new AdmissionActivityListResponse();
            try
            {
                var dt = _db.GetDataTable("Administration_GetAdmissionActivityStatusList");
                if (dt == null) { r.Success = true; return r; }
                bool HC(string n) => dt.Columns.Contains(n);
                foreach (System.Data.DataRow row in dt.Rows)
                    r.Items.Add(MapAdmission(row, HC));
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        public AdmissionActivityItem? GetAdmissionDetails(short phaseId)
        {
            try
            {
                var p = new DynamicParameters(); p.Add("@PhaseID", phaseId);
                var dt = _db.GetDataTable("Administration_GetAdmissionActivityStatusDetails", p);
                if (dt == null || dt.Rows.Count == 0) return null;
                bool HC(string n) => dt.Columns.Contains(n);
                return MapAdmission(dt.Rows[0], HC);
            }
            catch { return null; }
        }

        public SaveActivityStatusResponse SaveAdmission(SaveAdmissionActivityRequest req,
                                                        string modifiedBy, string ipAddress)
        {
            try
            {
                DateTime ParseDt(string s) =>
                    DateTime.TryParseExact(s.Trim(), DATE_FMTS,
                        System.Globalization.CultureInfo.InvariantCulture,
                        System.Globalization.DateTimeStyles.None, out var dt) ? dt : DateTime.Now;

                var p = new DynamicParameters();
                p.Add("@PhaseID",                  (short)req.PhaseID);
                p.Add("@AllotmentDisplayStartDate", ParseDt(req.AllotmentDisplayStartDate));
                p.Add("@AdmissionStartDate",        ParseDt(req.AdmissionStartDate));
                p.Add("@CandidateAdmissionLastDate",ParseDt(req.CandidateAdmissionLastDate));
                p.Add("@CollegeAdmissionLastDate",  ParseDt(req.CollegeAdmissionLastDate));
                p.Add("@SystemAdmissionLastDate",   ParseDt(req.SystemAdmissionLastDate));
                p.Add("@IsCurrentPhase",            req.IsCurrentPhase);
                p.Add("@IsActive",                  req.IsActive);
                p.Add("@ModifiedBy",                modifiedBy);
                p.Add("@ModifiedByIPAddress",       ipAddress);
                var result = _db.ExecuteScalar("Administration_SaveAdmissionActivityStatusDetails", p)?.ToString() ?? "";
                bool ok = result.ToUpper() == "Y" || result == "1";
                return new SaveActivityStatusResponse { Success=ok, Message=ok?"Admission schedule saved successfully.":result };
            }
            catch (Exception ex) { return new SaveActivityStatusResponse { Success=false, Message=ex.Message }; }
        }

        // ── Mappers ───────────────────────────────────────────────────────────
        private static ActivityStatusItem MapActivity(System.Data.DataRow row, Func<string,bool> HC) => new()
        {
            ActivityName          = HC("ActivityName")          ? row["ActivityName"]?.ToString()          ?? "" : "",
            ActivityDetails       = HC("ActivityDetails")       ? row["ActivityDetails"]?.ToString()       ?? "" : "",
            ActivityStartDateTime = HC("ActivityStartDateTimeF")? row["ActivityStartDateTimeF"]?.ToString() ?? "" :
                                    HC("ActivityStartDateTime") && row["ActivityStartDateTime"] != DBNull.Value
                                        ? Convert.ToDateTime(row["ActivityStartDateTime"]).ToString("dd-MM-yyyy HH:mm") : "",
            ActivityEndDateTime   = HC("ActivityEndDateTimeF")  ? row["ActivityEndDateTimeF"]?.ToString()   ?? "" :
                                    HC("ActivityEndDateTime")   && row["ActivityEndDateTime"]   != DBNull.Value
                                        ? Convert.ToDateTime(row["ActivityEndDateTime"]).ToString("dd-MM-yyyy HH:mm") : "",
        };

        private static AdmissionActivityItem MapAdmission(System.Data.DataRow row, Func<string,bool> HC) => new()
        {
            PhaseID                    = HC("PhaseID")                    && row["PhaseID"] != DBNull.Value ? Convert.ToInt32(row["PhaseID"]) : 0,
            Phase                      = HC("Phase")                      ? row["Phase"]?.ToString()                      ?? "" : "",
            AllotmentDisplayStartDate  = HC("AllotmentDisplayStartDateF") ? row["AllotmentDisplayStartDateF"]?.ToString()  ?? "" : "",
            AdmissionStartDate         = HC("AdmissionStartDateF")        ? row["AdmissionStartDateF"]?.ToString()         ?? "" : "",
            CandidateAdmissionLastDate = HC("CandidateAdmissionLastDateF")? row["CandidateAdmissionLastDateF"]?.ToString() ?? "" : "",
            CollegeAdmissionLastDate   = HC("CollegeAdmissionLastDateF")  ? row["CollegeAdmissionLastDateF"]?.ToString()   ?? "" : "",
            SystemAdmissionLastDate    = HC("SystemAdmissionLastDateF")   ? row["SystemAdmissionLastDateF"]?.ToString()    ?? "" : "",
            IsCurrentPhase             = HC("IsCurrentPhase")             && row["IsCurrentPhase"] != DBNull.Value && Convert.ToBoolean(row["IsCurrentPhase"]),
            IsActive                   = HC("IsActive")                   && row["IsActive"]        != DBNull.Value && Convert.ToBoolean(row["IsActive"]),
        };
    }
}
