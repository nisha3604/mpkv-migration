using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Services;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;
        public DashboardController(IDashboardService dashboardService) => _dashboardService = dashboardService;

        private long GetCandidateID()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return long.TryParse(sub, out var id) ? id : 0;
        }

        [HttpGet]             public IActionResult GetDashboard() { var id = GetCandidateID(); if (id <= 0) return Unauthorized(); var loginId = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.UniqueName) ?? User.FindFirstValue("unique_name") ?? ""; return Ok(_dashboardService.GetDashboard(id, loginId)); }
        [HttpGet("progress")] public IActionResult GetProgress()  { var id = GetCandidateID(); if (id <= 0) return Unauthorized(); var loginId = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.UniqueName) ?? User.FindFirstValue("unique_name") ?? ""; return Ok(_dashboardService.GetDashboard(id, loginId)); }
    }
}
