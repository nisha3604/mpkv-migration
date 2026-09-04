using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.Admin;
using Mpkv.Api.Services;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    [ApiController]
    [Route("api/admin/activity-status")]
    [Authorize]
    public class ActivityStatusController : ControllerBase
    {
        private readonly IActivityStatusService _svc;
        private const short REGION_ID = 1;

        public ActivityStatusController(IActivityStatusService svc) => _svc = svc;

        private int    GetUserTypeId() => int.TryParse(User.FindFirstValue("UserTypeID") ?? "0", out var v) ? v : 0;
        private string GetLoginId()    => User.FindFirstValue(ClaimTypes.Name) ?? "";
        private string GetIp()         => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        private bool   IsAdmin()       => UserTypeHelper.IsAdmin(GetUserTypeId());

        // GET /api/admin/activity-status
        [HttpGet]
        public IActionResult GetList() {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetList(REGION_ID));
        }

        // GET /api/admin/activity-status/{activityName}
        [HttpGet("{activityName}")]
        public IActionResult GetDetails(string activityName) {
            if (!IsAdmin()) return Forbid();
            var item = _svc.GetDetails(REGION_ID, activityName);
            return Ok(new { success = item != null, item });
        }

        // POST /api/admin/activity-status
        [HttpPost]
        public IActionResult Save([FromBody] SaveActivityStatusRequest req) {
            if (!IsAdmin()) return Forbid();
            if (req == null) return BadRequest(new SaveActivityStatusResponse { Success=false, Message="Invalid request." });
            var r = _svc.Save(REGION_ID, req, GetLoginId(), GetIp());
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // GET /api/admin/activity-status/admission/list
        [HttpGet("admission/list")]
        public IActionResult GetAdmissionList() {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetAdmissionList());
        }

        // GET /api/admin/activity-status/admission/{phaseId}
        [HttpGet("admission/{phaseId:int}")]
        public IActionResult GetAdmissionDetails(short phaseId) {
            if (!IsAdmin()) return Forbid();
            var item = _svc.GetAdmissionDetails(phaseId);
            return Ok(new { success = item != null, item });
        }

        // POST /api/admin/activity-status/admission
        [HttpPost("admission")]
        public IActionResult SaveAdmission([FromBody] SaveAdmissionActivityRequest req) {
            if (!IsAdmin()) return Forbid();
            if (req == null) return BadRequest(new SaveActivityStatusResponse { Success=false, Message="Invalid request." });
            var r = _svc.SaveAdmission(req, GetLoginId(), GetIp());
            return r.Success ? Ok(r) : BadRequest(r);
        }
    }
}
