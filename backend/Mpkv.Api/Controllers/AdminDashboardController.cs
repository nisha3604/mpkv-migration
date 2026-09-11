using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Helpers;
using Mpkv.Api.Services;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    [ApiController]
    [Route("api/admin/dashboard")]
    [Authorize]
    public class AdminDashboardController : ControllerBase
    {
        private readonly IAdminDashboardService _svc;
        public AdminDashboardController(IAdminDashboardService svc) => _svc = svc;

        private int    GetUserTypeId() => int.TryParse(User.FindFirstValue("UserTypeID") ?? "0", out var v) ? v : 0;
        private string GetLoginId()    => User.FindFirstValue(ClaimTypes.Name) ?? "";

        // GET /api/admin/dashboard
        [HttpGet]
        public IActionResult Get()
        {
            if (!UserTypeHelper.IsAdmin(GetUserTypeId())) return Forbid();
            return Ok(_svc.GetDashboard(GetUserTypeId(), GetLoginId()));
        }
    }
}
