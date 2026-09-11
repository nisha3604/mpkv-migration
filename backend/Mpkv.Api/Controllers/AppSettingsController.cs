using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Helpers;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    /// <summary>
    /// Mirrors Administration/CheckAppSettings.aspx.
    /// Returns a flat list of all appsettings.json keys + values.
    /// Restricted to UserTypeID = 11 (Super Admin) ONLY — not Admin2 (12).
    /// GET /api/admin/app-settings
    /// </summary>
    [ApiController]
    [Route("api/admin/app-settings")]
    [Authorize]
    public class AppSettingsController : ControllerBase
    {
        private readonly IConfiguration _config;

        public AppSettingsController(IConfiguration config) => _config = config;

        private int GetUserTypeId() =>
            int.TryParse(User.FindFirstValue("UserTypeID") ?? "0", out var v) ? v : 0;

        // Sensitive keys — values are masked so admin can confirm they are set
        // without exposing the actual secrets.
        private static readonly HashSet<string> _sensitiveKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            "Jwt:Key",
            "AzureBlob:StorageConnectionString",
            "Messaging:Msg91AuthKey",
            "Messaging:Gmail:RegistrationPassword",
            "Messaging:Gmail:ResetPasswordPassword",
            "Messaging:Gmail:OthersPassword",
            "NSDL:SecretKey",
            "NSDL:Password",
            "BillDesk:SecretKey",
            "BillDesk:ClientId",
            "ConnectionStrings:DefaultConnection",
        };

        [HttpGet]
        public IActionResult Get()
        {
            // Super Admin (11) only — Admin2 (12) is blocked
            if (GetUserTypeId() != UserTypeHelper.Admin)
                return Forbid();

            var items = new List<AppSettingItem>();

            // Flatten the entire IConfiguration tree into Key=Value leaf pairs
            foreach (var kvp in _config.AsEnumerable().OrderBy(x => x.Key))
            {
                // Skip section headers (null value) — only include leaf nodes
                if (kvp.Value == null) continue;

                var value = _sensitiveKeys.Contains(kvp.Key)
                    ? MaskValue(kvp.Value)
                    : kvp.Value;

                items.Add(new AppSettingItem { Key = kvp.Key, Value = value });
            }

            return Ok(new { success = true, items });
        }

        /// <summary>Shows first 4 chars then **** for sensitive values.</summary>
        private static string MaskValue(string value)
        {
            if (string.IsNullOrEmpty(value)) return value;
            var visible = Math.Min(4, value.Length);
            return value[..visible] + new string('*', Math.Max(0, value.Length - visible));
        }
    }

    public class AppSettingItem
    {
        public string Key   { get; set; } = "";
        public string Value { get; set; } = "";
    }
}
