using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.Admin;
using Mpkv.Api.Services;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    /// <summary>
    /// Phase Management — mirrors ManagePhase.aspx from the old project.
    /// Access: UserTypeID 11 or 12 (admin) only.
    ///
    /// GET    /api/admin/phases          → list all phases
    /// GET    /api/admin/phases/{id}     → get single phase for edit
    /// POST   /api/admin/phases          → save phase (PhaseID=0 insert, >0 update)
    /// DELETE /api/admin/phases/{id}     → delete phase
    /// </summary>
    [ApiController]
    [Route("api/admin/phases")]
    [Authorize]
    public class PhaseController : ControllerBase
    {
        private readonly IPhaseService _svc;

        public PhaseController(IPhaseService svc) => _svc = svc;

        private int    GetUserTypeId() => int.TryParse(User.FindFirstValue("UserTypeID") ?? "0", out var v) ? v : 0;
        private string GetLoginId()    => User.FindFirstValue(ClaimTypes.Name) ?? "";
        private string GetIp()         => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        private bool   IsAdmin()       => UserTypeHelper.IsAdmin(GetUserTypeId());

        // GET /api/admin/phases
        [HttpGet]
        public IActionResult GetList()
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetPhaseList());
        }

        // GET /api/admin/phases/{id}
        [HttpGet("{id:int}")]
        public IActionResult GetDetails(int id)
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetPhaseDetails(id));
        }

        // POST /api/admin/phases
        [HttpPost]
        public IActionResult Save([FromBody] SavePhaseRequest req)
        {
            if (!IsAdmin()) return Forbid();
            if (req == null) return BadRequest(new SavePhaseResponse { Success = false, Message = "Invalid request." });
            var r = _svc.SavePhase(req, GetLoginId(), GetIp());
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // DELETE /api/admin/phases/{id}
        [HttpDelete("{id:int}")]
        public IActionResult Delete(int id)
        {
            if (!IsAdmin()) return Forbid();
            var r = _svc.DeletePhase(id, GetLoginId(), GetIp());
            return r.Success ? Ok(r) : BadRequest(r);
        }
    }
}
