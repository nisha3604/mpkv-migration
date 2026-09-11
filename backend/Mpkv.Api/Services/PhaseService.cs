using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.Admin;

namespace Mpkv.Api.Services
{
    public interface IPhaseService
    {
        PhaseListResponse    GetPhaseList();
        PhaseDetailsResponse GetPhaseDetails(int phaseId);
        SavePhaseResponse    SavePhase(SavePhaseRequest req, string userLoginId, string ipAddress);
        DeletePhaseResponse  DeletePhase(int phaseId, string userLoginId, string ipAddress);
    }

    /// <summary>
    /// Mirrors AdmissionWorker.cs phase methods + Repository.Admission.cs from old project.
    ///
    /// SPs used:
    ///   Administration_GetPhaseList    — list all phases for admin grid
    ///   Administration_GetPhaseDetails — single phase for edit form
    ///   Administration_SavePhase       — insert (PhaseID=0) or update (PhaseID>0)
    ///   Administration_DeletePhase     — delete a phase
    ///
    /// Date format: "dd-MM-yyyy HH:mm" (same as old project ParseExact format)
    /// </summary>
    public class PhaseService : IPhaseService
    {
        private readonly DbAccess _db;

        private static readonly string[] DATE_FMTS =
            { "dd-MM-yyyy HH:mm", "dd/MM/yyyy HH:mm", "yyyy-MM-dd HH:mm", "dd-MM-yyyy", "yyyy-MM-dd" };

        public PhaseService(DbAccess db) => _db = db;

        // ── GET list ─────────────────────────────────────────────────────────
        public PhaseListResponse GetPhaseList()
        {
            var r = new PhaseListResponse();
            try
            {
                var dt = _db.GetDataTable("Administration_GetPhaseList");
                if (dt == null) { r.Success = true; return r; }
                bool HC(string n) => dt.Columns.Contains(n);
                foreach (System.Data.DataRow row in dt.Rows)
                    r.Items.Add(MapPhase(row, HC));
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── GET single ───────────────────────────────────────────────────────
        public PhaseDetailsResponse GetPhaseDetails(int phaseId)
        {
            var r = new PhaseDetailsResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@PhaseID", (short)phaseId);
                var dt = _db.GetDataTable("Administration_GetPhaseDetails", p);
                if (dt == null || dt.Rows.Count == 0)
                {
                    r.Success = false; r.Message = "Phase not found."; return r;
                }
                bool HC(string n) => dt.Columns.Contains(n);
                r.Item    = MapPhase(dt.Rows[0], HC);
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ── SAVE (insert or update) ──────────────────────────────────────────
        public SavePhaseResponse SavePhase(SavePhaseRequest req, string userLoginId, string ipAddress)
        {
            try
            {
                DateTime ParseDt(string s) =>
                    DateTime.TryParseExact(s?.Trim() ?? "", DATE_FMTS,
                        System.Globalization.CultureInfo.InvariantCulture,
                        System.Globalization.DateTimeStyles.None, out var dt)
                        ? dt : DateTime.Now;

                var p = new DynamicParameters();
                p.Add("@PhaseID",                   (short)req.PhaseID);
                p.Add("@Phase",                     req.Phase?.Trim() ?? "");
                p.Add("@AllotmentDisplayStartDate",  ParseDt(req.AllotmentDisplayStartDate));
                p.Add("@AdmissionStartDate",         ParseDt(req.AdmissionStartDate));
                p.Add("@CandidateAdmissionLastDate", ParseDt(req.CandidateAdmissionLastDate));
                p.Add("@CollegeAdmissionLastDate",   ParseDt(req.CollegeAdmissionLastDate));
                p.Add("@SystemAdmissionLastDate",    ParseDt(req.SystemAdmissionLastDate));
                p.Add("@IsCurrentPhase",             req.IsCurrentPhase   ? 1 : 0);
                p.Add("@IsCounsellingPhase",         req.IsCounsellingPhase ? 1 : 0);
                p.Add("@IsActive",                   req.IsActive         ? 1 : 0);
                p.Add("@UserLoginID",                userLoginId);
                p.Add("@IPAddress",                  ipAddress);

                var result = _db.ExecuteScalar("Administration_SavePhase", p)?.ToString() ?? "";
                bool ok    = result.ToUpper() == "Y" || result == "1";
                return new SavePhaseResponse
                {
                    Success = ok,
                    Message = ok
                        ? (req.PhaseID == 0 ? "Phase added successfully." : "Phase updated successfully.")
                        : (result.Length > 0 ? result : "Failed to save phase.")
                };
            }
            catch (Exception ex) { return new SavePhaseResponse { Success = false, Message = ex.Message }; }
        }

        // ── DELETE ────────────────────────────────────────────────────────────
        public DeletePhaseResponse DeletePhase(int phaseId, string userLoginId, string ipAddress)
        {
            try
            {
                var p = new DynamicParameters();
                p.Add("@PhaseID",     (short)phaseId);
                p.Add("@UserLoginID", userLoginId);
                p.Add("@IPAddress",   ipAddress);

                var result = _db.ExecuteScalar("Administration_DeletePhase", p)?.ToString() ?? "";
                bool ok    = result.ToUpper() == "Y" || result == "1";
                return new DeletePhaseResponse
                {
                    Success = ok,
                    Message = ok ? "Phase deleted successfully." : (result.Length > 0 ? result : "Failed to delete phase.")
                };
            }
            catch (Exception ex) { return new DeletePhaseResponse { Success = false, Message = ex.Message }; }
        }

        // ── Mapper ───────────────────────────────────────────────────────────
        private static PhaseItem MapPhase(System.Data.DataRow row, Func<string, bool> HC) => new()
        {
            PhaseID = HC("PhaseID") && row["PhaseID"] != DBNull.Value
                ? Convert.ToInt32(row["PhaseID"]) : 0,
            Phase = HC("Phase") ? row["Phase"]?.ToString() ?? "" : "",

            // Use formatted string columns (AllotmentDisplayStartDateF etc.) from SP
            AllotmentDisplayStartDate  = HC("AllotmentDisplayStartDateF")  ? row["AllotmentDisplayStartDateF"]?.ToString()  ?? ""
                                       : HC("AllotmentDisplayStartDate")  && row["AllotmentDisplayStartDate"]  != DBNull.Value
                                           ? Convert.ToDateTime(row["AllotmentDisplayStartDate"]).ToString("dd-MM-yyyy HH:mm") : "",
            AdmissionStartDate         = HC("AdmissionStartDateF")         ? row["AdmissionStartDateF"]?.ToString()         ?? ""
                                       : HC("AdmissionStartDate")         && row["AdmissionStartDate"]         != DBNull.Value
                                           ? Convert.ToDateTime(row["AdmissionStartDate"]).ToString("dd-MM-yyyy HH:mm") : "",
            CandidateAdmissionLastDate = HC("CandidateAdmissionLastDateF") ? row["CandidateAdmissionLastDateF"]?.ToString() ?? ""
                                       : HC("CandidateAdmissionLastDate") && row["CandidateAdmissionLastDate"] != DBNull.Value
                                           ? Convert.ToDateTime(row["CandidateAdmissionLastDate"]).ToString("dd-MM-yyyy HH:mm") : "",
            CollegeAdmissionLastDate   = HC("CollegeAdmissionLastDateF")   ? row["CollegeAdmissionLastDateF"]?.ToString()   ?? ""
                                       : HC("CollegeAdmissionLastDate")   && row["CollegeAdmissionLastDate"]   != DBNull.Value
                                           ? Convert.ToDateTime(row["CollegeAdmissionLastDate"]).ToString("dd-MM-yyyy HH:mm") : "",
            SystemAdmissionLastDate    = HC("SystemAdmissionLastDateF")    ? row["SystemAdmissionLastDateF"]?.ToString()    ?? ""
                                       : HC("SystemAdmissionLastDate")    && row["SystemAdmissionLastDate"]    != DBNull.Value
                                           ? Convert.ToDateTime(row["SystemAdmissionLastDate"]).ToString("dd-MM-yyyy HH:mm") : "",

            IsCurrentPhase    = HC("IsCurrentPhase")    && row["IsCurrentPhase"]    != DBNull.Value && Convert.ToBoolean(row["IsCurrentPhase"]),
            IsCounsellingPhase= HC("IsCounsellingPhase")&& row["IsCounsellingPhase"] != DBNull.Value && Convert.ToBoolean(row["IsCounsellingPhase"]),
            IsActive          = HC("IsActive")          && row["IsActive"]          != DBNull.Value && Convert.ToBoolean(row["IsActive"]),
        };
    }
}
