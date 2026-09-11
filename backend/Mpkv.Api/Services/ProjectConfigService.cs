using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.Admin;

namespace Mpkv.Api.Services
{
    public interface IProjectConfigService
    {
        ConfigListResponse    GetList(short regionId);
        ConfigDetailsResponse GetDetails(short regionId, string appKey);
        SaveConfigResponse    Save(short regionId, SaveConfigRequest req, string modifiedBy, string ipAddress);
    }

    /// <summary>
    /// Mirrors ManageProjectConfiguration.aspx.
    /// SPs: Administration_GetProjectConfigurationList(@RegionID)
    ///      Administration_GetProjectConfigurationDetails(@RegionID, @AppKey)
    ///         → Returns Tables[0] with AppKeyDetails, ControlRequired, ControlMaxValue, AppValue
    ///      Administration_SaveProjectConfigurationDetails(@RegionID, @AppKey, @AppValue, @ModifiedBy, @IP)
    /// </summary>
    public class ProjectConfigService : IProjectConfigService
    {
        private readonly DbAccess _db;
        public ProjectConfigService(DbAccess db) => _db = db;

        public ConfigListResponse GetList(short regionId)
        {
            var r = new ConfigListResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@RegionID", regionId);
                var dt = _db.GetDataTable("Administration_GetProjectConfigurationList", p);
                if (dt == null) { r.Success = true; return r; }
                bool HC(string n) => dt.Columns.Contains(n);
                foreach (System.Data.DataRow row in dt.Rows)
                    r.Items.Add(new ConfigItem
                    {
                        AppKey        = HC("AppKey")        ? row["AppKey"]?.ToString()        ?? "" : "",
                        AppKeyDetails = HC("AppKeyDetails") ? row["AppKeyDetails"]?.ToString() ?? "" : "",
                        AppValue      = HC("AppValue")      ? row["AppValue"]?.ToString()      ?? "" : "",
                    });
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        public ConfigDetailsResponse GetDetails(short regionId, string appKey)
        {
            var r = new ConfigDetailsResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@RegionID", regionId);
                p.Add("@AppKey",   appKey);
                var ds = _db.GetDataSet("Administration_GetProjectConfigurationDetails", p);
                if (ds == null || ds.Tables.Count == 0 || ds.Tables[0].Rows.Count == 0)
                {
                    r.Success = false; r.Message = "Configuration not found."; return r;
                }
                bool HC(string n) => ds.Tables[0].Columns.Contains(n);
                var row = ds.Tables[0].Rows[0];
                r.AppKey          = appKey;
                r.AppKeyDetails   = HC("AppKeyDetails")   ? row["AppKeyDetails"]?.ToString()   ?? "" : "";
                r.AppValue        = HC("AppValue")        ? row["AppValue"]?.ToString()        ?? "" : "";
                r.ControlRequired = HC("ControlRequired") ? row["ControlRequired"]?.ToString() ?? "TextBox" : "TextBox";
                r.ControlMaxValue = HC("ControlMaxValue") && row["ControlMaxValue"] != DBNull.Value
                    ? Convert.ToInt32(row["ControlMaxValue"]) : 0;
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        public SaveConfigResponse Save(short regionId, SaveConfigRequest req, string modifiedBy, string ipAddress)
        {
            try
            {
                var p = new DynamicParameters();
                p.Add("@RegionID",            regionId);
                p.Add("@AppKey",              req.AppKey);
                p.Add("@AppValue",            req.AppValue);
                p.Add("@ModifiedBy",          modifiedBy);
                p.Add("@ModifiedByIPAddress", ipAddress);
                var result = _db.ExecuteScalar("Administration_SaveProjectConfigurationDetails", p)?.ToString() ?? "";
                bool ok = result.ToUpper() == "Y" || result == "1";
                return new SaveConfigResponse { Success = ok, Message = ok ? "Configuration saved successfully." : result };
            }
            catch (Exception ex) { return new SaveConfigResponse { Success = false, Message = ex.Message }; }
        }
    }
}
