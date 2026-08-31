using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.College;
using Mpkv.Api.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    /// <summary>
    /// College self-service + admin college operations.
    /// UserTypeID 61 = sees own record only (CollegeID from JWT).
    /// UserTypeID 11/12 = sees any college via ?collegeId= query param.
    /// Mirrors: CollegeSummary.aspx + EditCollegeDetails.aspx + DashboardCollege.aspx
    /// </summary>
    [ApiController]
    [Route("api/college")]
    [Authorize]
    public class CollegeController : ControllerBase
    {
        private readonly ICollegeService          _collegeService;
        private readonly ICollegeDashboardService _dashboardService;

        public CollegeController(ICollegeService collegeService, ICollegeDashboardService dashboardService)
        {
            _collegeService   = collegeService;
            _dashboardService = dashboardService;
        }

        private long   GetUserId()     => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? "0");
        private string GetLoginId()    => User.FindFirstValue(JwtRegisteredClaimNames.UniqueName) ?? "";
        private int    GetUserTypeId() => int.Parse(User.FindFirstValue("UserTypeID") ?? "0");
        private string GetIp()         => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

        /// <summary>
        /// Resolves CollegeID:
        /// - College user (61): always their own ID from JWT
        /// - Admin (11/12):     uses ?collegeId= query param, fallback to own ID
        /// </summary>
        private long ResolveCollegeId(long? queryCollegeId = null)
            => UserTypeHelper.IsCollege(GetUserTypeId()) ? GetUserId() : (queryCollegeId ?? GetUserId());

        // GET /api/college/dashboard
        [HttpGet("dashboard")]
        public IActionResult GetDashboard()
        {
            var result = _dashboardService.GetDashboard(ResolveCollegeId(), GetLoginId(), GetUserTypeId());
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // GET /api/college/debug-login-time  — TEMPORARY: shows raw SP output for login time diagnosis
        [HttpGet("debug-login-time")]
        public IActionResult DebugLoginTime()
        {
            try
            {
                var p = new Dapper.DynamicParameters();
                p.Add("@UserTypeID",  GetUserTypeId());
                p.Add("@UserLoginID", GetLoginId());

                // Use reflection to access _db from dashboard service — instead inject DbAccess directly
                var dbField = _dashboardService.GetType()
                    .GetField("_db", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                var db = dbField?.GetValue(_dashboardService) as Mpkv.Api.Data.DbAccess;

                if (db == null)
                    return Ok(new { error = "Could not access DbAccess", userTypeId = GetUserTypeId(), loginId = GetLoginId() });

                var dt = db.GetDataTable("Account_GetLoggedInUserDetails", p);

                if (dt == null || dt.Rows.Count == 0)
                    return Ok(new { rowCount = 0, columns = new string[0], userTypeId = GetUserTypeId(), loginId = GetLoginId(), message = "SP returned no rows" });

                var columns = dt.Columns.Cast<System.Data.DataColumn>().Select(c => c.ColumnName).ToList();
                var rows    = dt.Rows.Cast<System.Data.DataRow>()
                    .Select(r => columns.ToDictionary(c => c, c => r[c]?.ToString() ?? "(null)"))
                    .ToList();

                return Ok(new { rowCount = dt.Rows.Count, columns, rows, userTypeId = GetUserTypeId(), loginId = GetLoginId() });
            }
            catch (Exception ex)
            {
                return Ok(new { error = ex.Message, userTypeId = GetUserTypeId(), loginId = GetLoginId() });
            }
        }

        // GET /api/college/summary?collegeId=
        [HttpGet("summary")]
        public IActionResult GetSummary([FromQuery] long? collegeId = null)
        {
            var result = _collegeService.GetSummary(ResolveCollegeId(collegeId));
            // Always return 200 — frontend reads success flag
            return Ok(result);
        }

        // GET /api/college/details?collegeId=
        [HttpGet("details")]
        public IActionResult GetDetails([FromQuery] long? collegeId = null)
        {
            var result = _collegeService.GetDetails(ResolveCollegeId(collegeId));
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // POST /api/college/save?collegeId=
        [HttpPost("save")]
        public IActionResult Save([FromBody] SaveCollegeRequest request, [FromQuery] long? collegeId = null)
        {
            if (request == null) return BadRequest(new CollegeActionResponse { Success = false, Message = "Invalid request." });
            var result = _collegeService.SaveDetails(ResolveCollegeId(collegeId), GetUserTypeId(), GetLoginId(), GetIp(), request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // POST /api/college/activate?collegeId=  (admin only)
        [HttpPost("activate")]
        public IActionResult Activate([FromQuery] long collegeId)
        {
            if (!UserTypeHelper.IsAdmin(GetUserTypeId())) return Forbid();
            var result = _collegeService.SetActiveStatus(collegeId, true, GetLoginId(), GetIp());
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // POST /api/college/deactivate?collegeId=  (admin only)
        [HttpPost("deactivate")]
        public IActionResult Deactivate([FromQuery] long collegeId)
        {
            if (!UserTypeHelper.IsAdmin(GetUserTypeId())) return Forbid();
            var result = _collegeService.SetActiveStatus(collegeId, false, GetLoginId(), GetIp());
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
