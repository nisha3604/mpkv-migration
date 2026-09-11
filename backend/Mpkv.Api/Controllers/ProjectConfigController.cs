using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.Admin;
using Mpkv.Api.Services;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    [ApiController]
    [Route("api/admin/config")]
    [Authorize]
    public class ProjectConfigController : ControllerBase
    {
        private readonly IProjectConfigService _svc;
        private const short REGION_ID = 1;

        public ProjectConfigController(IProjectConfigService svc) => _svc = svc;

        private int    GetUserTypeId() => int.TryParse(User.FindFirstValue("UserTypeID") ?? "0", out var v) ? v : 0;
        private string GetLoginId()    => User.FindFirstValue(ClaimTypes.Name) ?? "";
        private string GetIp()         => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        private bool   IsAdmin()       => UserTypeHelper.IsAdmin(GetUserTypeId());

        // GET /api/admin/config
        [HttpGet]
        public IActionResult GetList()
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetList(REGION_ID));
        }

        // GET /api/admin/config/{key}
        [HttpGet("{key}")]
        public IActionResult GetDetails(string key)
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetDetails(REGION_ID, key));
        }

        // POST /api/admin/config
        [HttpPost]
        public IActionResult Save([FromBody] SaveConfigRequest req)
        {
            if (!IsAdmin()) return Forbid();
            if (req == null) return BadRequest(new SaveConfigResponse { Success = false, Message = "Invalid request." });
            var r = _svc.Save(REGION_ID, req, GetLoginId(), GetIp());
            return r.Success ? Ok(r) : BadRequest(r);
        }
    }
}
