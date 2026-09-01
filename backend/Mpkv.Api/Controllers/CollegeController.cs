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
