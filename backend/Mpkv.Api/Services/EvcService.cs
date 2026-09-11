using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.Admin;

namespace Mpkv.Api.Services
{
    public interface IEvcService
    {
        // EVC (top-level, UserTypeID=41)
        EvcListResponse    GetEvcList();
        EvcDetailsResponse GetEvcDetails(long evcId);
        SaveEvcResponse    SaveEvc(SaveEvcRequest req, string adminLoginId, string ipAddress);
        ToggleEvcResponse  ActivateEvc(long evcId, string adminLoginId, string ipAddress);
        ToggleEvcResponse  DeactivateEvc(long evcId, string adminLoginId, string ipAddress);

        // Sub-EVC (child, UserTypeID=42)
        EvcListResponse    GetSubEvcList(long parentEvcId);
        EvcDetailsResponse GetSubEvcDetails(long evcId);
        SaveEvcResponse    SaveSubEvc(SaveEvcRequest req, string adminLoginId, string ipAddress);
        ToggleEvcResponse  ActivateSubEvc(long evcId, string adminLoginId, string ipAddress);
        ToggleEvcResponse  DeactivateSubEvc(long evcId, string adminLoginId, string ipAddress);
    }

    /// <summary>
    /// Mirrors EVCWorker.cs + Repository.EVC.cs from the old project.
    /// All 9 EVC SPs are called here.
    ///
    /// UserTypeID=41 = EVC Coordinator (top-level)
    /// UserTypeID=42 = Sub-EVC Coordinator (child of 41)
    ///
    /// Passwords are auto-generated (8 chars) and Base64-encoded before storage,
    /// matching old project Helper.GeneratePassword(8) + CommonHelper.Base64Encrypt().
    /// </summary>
    public class EvcService : IEvcService
    {
        private readonly DbAccess _db;
        public EvcService(DbAccess db) => _db = db;

        // ── Generate random password (mirrors Helper.GeneratePassword) ─────────
        private static string GeneratePassword(int length = 8)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
            var rng = new Random();
            return new string(Enumerable.Range(0, length).Select(_ => chars[rng.Next(chars.Length)]).ToArray());
        }

        // ════════════════════════════════════════════════════════════════════════
        // EVC — top-level coordinators
        // ════════════════════════════════════════════════════════════════════════

        public EvcListResponse GetEvcList()
        {
            var r = new EvcListResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@Flag", "All");
                var dt = _db.GetDataTable("Administration_GetEVCList", p);
                bool HC(System.Data.DataRow row, string n) => dt!.Columns.Contains(n) && row[n] != DBNull.Value;
                if (dt != null)
                    foreach (System.Data.DataRow row in dt.Rows)
                        r.Items.Add(MapItem(row, HC));
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        public EvcDetailsResponse GetEvcDetails(long evcId)
        {
            var r = new EvcDetailsResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@EVCID", evcId);
                var dt = _db.GetDataTable("Administration_GetEVCDetails", p);
                if (dt != null && dt.Rows.Count > 0)
                {
                    var row = dt.Rows[0];
                    bool HC(string n) => dt.Columns.Contains(n) && row[n] != DBNull.Value;
                    r.Detail = new EvcDetail
                    {
                        EVCID               = HC("EVCID")               ? Convert.ToInt64(row["EVCID"])   : 0,
                        ParentEVCID         = HC("ParentEVCID")         ? Convert.ToInt64(row["ParentEVCID"]) : 0,
                        EVCCode             = HC("EVCCode")             ? row["EVCCode"]?.ToString()             ?? "" : "",
                        CoordinatorName     = HC("CoordinatorName")     ? row["CoordinatorName"]?.ToString()     ?? "" : "",
                        CoordinatorMobileNo = HC("CoordinatorMobileNo") ? row["CoordinatorMobileNo"]?.ToString() ?? "" : "",
                        CoordinatorEMailID  = HC("CoordinatorEMailID")  ? row["CoordinatorEMailID"]?.ToString()  ?? "" : "",
                    };
                    r.Success = true;
                }
                else { r.Success = false; r.Message = "EVC not found."; }
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        public SaveEvcResponse SaveEvc(SaveEvcRequest req, string adminLoginId, string ipAddress)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(req.CoordinatorName))
                    return new SaveEvcResponse { Success = false, Message = "Co-Ordinator Name is required." };

                var p = new DynamicParameters();
                p.Add("@EVCID",               req.EVCID);
                p.Add("@CoordinatorName",      req.CoordinatorName.Trim().ToUpper());
                p.Add("@CoordinatorMobileNo",  req.CoordinatorMobileNo?.Trim() ?? "");
                p.Add("@CoordinatorEMailID",   req.CoordinatorEMailID?.Trim().ToLower() ?? "");
                // Auto-generate password on add (EVCID=0); on edit pass empty (SP ignores it)
                p.Add("@Password",   req.EVCID == 0 ? PasswordHelper.Encode(GeneratePassword(8)) : "");
                p.Add("@UserTypeID",  41);   // EVC Coordinator
                p.Add("@UserLoginID", adminLoginId);
                p.Add("@IPAddress",   ipAddress);

                var result = _db.ExecuteScalar("Administration_SaveEVCDetails", p)?.ToString() ?? "";
                bool ok = result.ToUpper() == "Y";
                return new SaveEvcResponse
                {
                    Success = ok,
                    Message = ok ? (req.EVCID == 0 ? "EVC added successfully." : "EVC updated successfully.")
                                 : (result.Length > 0 ? result : "Failed to save. Please try again.")
                };
            }
            catch (Exception ex) { return new SaveEvcResponse { Success = false, Message = ex.Message }; }
        }

        public ToggleEvcResponse ActivateEvc(long evcId, string adminLoginId, string ipAddress)
            => ToggleEvc("Administration_ActivateEVC", evcId, adminLoginId, ipAddress, "EVC Activated Successfully.");

        public ToggleEvcResponse DeactivateEvc(long evcId, string adminLoginId, string ipAddress)
            => ToggleEvc("Administration_DeactivateEVC", evcId, adminLoginId, ipAddress, "EVC Deactivated Successfully.");

        // ════════════════════════════════════════════════════════════════════════
        // Sub-EVC — child coordinators
        // ════════════════════════════════════════════════════════════════════════

        public EvcListResponse GetSubEvcList(long parentEvcId)
        {
            var r = new EvcListResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@Flag",   "All");
                p.Add("@EVCID",  parentEvcId);
                var dt = _db.GetDataTable("Administration_GetSubEVCList", p);
                bool HC(System.Data.DataRow row, string n) => dt!.Columns.Contains(n) && row[n] != DBNull.Value;
                if (dt != null)
                    foreach (System.Data.DataRow row in dt.Rows)
                        r.Items.Add(MapItem(row, HC));
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        public EvcDetailsResponse GetSubEvcDetails(long evcId) => GetEvcDetails(evcId); // same SP

        public SaveEvcResponse SaveSubEvc(SaveEvcRequest req, string adminLoginId, string ipAddress)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(req.CoordinatorName))
                    return new SaveEvcResponse { Success = false, Message = "Co-Ordinator Name is required." };
                if (req.ParentEVCID == 0)
                    return new SaveEvcResponse { Success = false, Message = "Parent EVC is required." };

                var p = new DynamicParameters();
                p.Add("@EVCID",               req.EVCID);
                p.Add("@ParentEVCID",          req.ParentEVCID);
                p.Add("@CoordinatorName",      req.CoordinatorName.Trim().ToUpper());
                p.Add("@CoordinatorMobileNo",  req.CoordinatorMobileNo?.Trim() ?? "");
                p.Add("@CoordinatorEMailID",   req.CoordinatorEMailID?.Trim().ToLower() ?? "");
                p.Add("@Password",   req.EVCID == 0 ? PasswordHelper.Encode(GeneratePassword(8)) : "");
                p.Add("@UserTypeID",  42);   // Sub-EVC Coordinator
                p.Add("@UserLoginID", adminLoginId);
                p.Add("@IPAddress",   ipAddress);

                var result = _db.ExecuteScalar("Administration_SaveSubEVCDetails", p)?.ToString() ?? "";
                bool ok = result.ToUpper() == "Y";
                return new SaveEvcResponse
                {
                    Success = ok,
                    Message = ok ? (req.EVCID == 0 ? "Sub-EVC added successfully." : "Sub-EVC updated successfully.")
                                 : (result.Length > 0 ? result : "Failed to save. Please try again.")
                };
            }
            catch (Exception ex) { return new SaveEvcResponse { Success = false, Message = ex.Message }; }
        }

        public ToggleEvcResponse ActivateSubEvc(long evcId, string adminLoginId, string ipAddress)
            => ToggleEvc("Administration_ActivateSubEVC", evcId, adminLoginId, ipAddress, "Sub-EVC Co-Ordinator Activated Successfully.");

        public ToggleEvcResponse DeactivateSubEvc(long evcId, string adminLoginId, string ipAddress)
            => ToggleEvc("Administration_DeactivateSubEVC", evcId, adminLoginId, ipAddress, "Sub-EVC Co-Ordinator Deactivated Successfully.");

        // ── Shared helpers ────────────────────────────────────────────────────

        private ToggleEvcResponse ToggleEvc(string spName, long evcId, string loginId, string ip, string successMsg)
        {
            try
            {
                var p = new DynamicParameters();
                p.Add("@EVCID",       evcId);
                p.Add("@UserLoginID", loginId);
                p.Add("@IPAddress",   ip);
                var result = _db.ExecuteScalar(spName, p)?.ToString() ?? "";
                bool ok = result.ToUpper() == "Y";
                return new ToggleEvcResponse
                {
                    Success = ok,
                    Message = ok ? successMsg : (result.Length > 0 ? result : "Operation failed. Please try again.")
                };
            }
            catch (Exception ex) { return new ToggleEvcResponse { Success = false, Message = ex.Message }; }
        }

        private static EvcListItem MapItem(System.Data.DataRow row, Func<System.Data.DataRow, string, bool> HC) => new()
        {
            EVCID               = HC(row, "EVCID")               ? Convert.ToInt64(row["EVCID"])   : 0,
            EVCCode             = HC(row, "EVCCode")             ? row["EVCCode"]?.ToString()             ?? "" : "",
            CoordinatorName     = HC(row, "CoordinatorName")     ? row["CoordinatorName"]?.ToString()     ?? "" : "",
            CoordinatorMobileNo = HC(row, "CoordinatorMobileNo") ? row["CoordinatorMobileNo"]?.ToString() ?? "" : "",
            CoordinatorEMailID  = HC(row, "CoordinatorEMailID")  ? row["CoordinatorEMailID"]?.ToString()  ?? "" : "",
            // IsActive stored as 1/0 (int) in DB — normalise to "Y"/"N" for frontend
            IsActive            = HC(row, "IsActive")
                ? (row["IsActive"]?.ToString() is "1" or "True" or "Y" or "true" ? "Y" : "N")
                : "N",
        };
    }
}
