using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.Admin;
using Mpkv.Api.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    /// <summary>
    /// EVC Management — mirrors ManageEVC.aspx, EVCDetails.aspx,
    ///                           ManageSubEVC.aspx, SubEVCDetails.aspx
    /// Access: UserTypeID 11 or 12 (admin) only.
    ///
    /// GET    /api/admin/evc                          → EVC list
    /// GET    /api/admin/evc/{id}                     → EVC details
    /// POST   /api/admin/evc                          → Save EVC (add/edit)
    /// POST   /api/admin/evc/{id}/activate            → Activate EVC
    /// POST   /api/admin/evc/{id}/deactivate          → Deactivate EVC
    ///
    /// GET    /api/admin/evc/{parentId}/sub-evc       → Sub-EVC list for parent
    /// GET    /api/admin/sub-evc/{id}                 → Sub-EVC details
    /// POST   /api/admin/sub-evc                      → Save Sub-EVC (add/edit)
    /// POST   /api/admin/sub-evc/{id}/activate        → Activate Sub-EVC
    /// POST   /api/admin/sub-evc/{id}/deactivate      → Deactivate Sub-EVC
    /// </summary>
    [ApiController]
    [Authorize]
    public class EvcController : ControllerBase
    {
        private readonly IEvcService _svc;
        public EvcController(IEvcService svc) => _svc = svc;

        private int    GetUserTypeId() => int.TryParse(User.FindFirstValue("UserTypeID") ?? "0", out var v) ? v : 0;
        private string GetLoginId()    => User.FindFirstValue(ClaimTypes.Name) ?? "";
        private string GetIp()         => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        private long   GetUserId()
        {
            var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                   ?? User.FindFirstValue("sub") ?? "0";
            return long.TryParse(sub, out var v) ? v : 0;
        }
        private bool   IsAdmin()       => UserTypeHelper.IsAdmin(GetUserTypeId());
        private bool   IsAdminOrEVC()  => UserTypeHelper.IsAdmin(GetUserTypeId()) || UserTypeHelper.IsEVC(GetUserTypeId());

        // ── EVC ──────────────────────────────────────────────────────────────

        [HttpGet("api/admin/evc")]
        public IActionResult GetList()
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetEvcList());
        }

        [HttpGet("api/admin/evc/{id:long}")]
        public IActionResult GetDetails(long id)
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetEvcDetails(id));
        }

        [HttpPost("api/admin/evc")]
        public IActionResult Save([FromBody] SaveEvcRequest req)
        {
            if (!IsAdmin()) return Forbid();
            if (req == null) return BadRequest(new SaveEvcResponse { Success = false, Message = "Invalid request." });
            req.ParentEVCID = 0; // top-level EVC has no parent
            return Ok(_svc.SaveEvc(req, GetLoginId(), GetIp()));
        }

        [HttpPost("api/admin/evc/{id:long}/activate")]
        public IActionResult Activate(long id)
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.ActivateEvc(id, GetLoginId(), GetIp()));
        }

        [HttpPost("api/admin/evc/{id:long}/deactivate")]
        public IActionResult Deactivate(long id)
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.DeactivateEvc(id, GetLoginId(), GetIp()));
        }

        // ── Sub-EVC ───────────────────────────────────────────────────────────

        [HttpGet("api/admin/evc/{parentId:long}/sub-evc")]
        public IActionResult GetSubList(long parentId)
        {
            if (!IsAdminOrEVC()) return Forbid();
            return Ok(_svc.GetSubEvcList(parentId));
        }

        // GET /api/admin/evc/my-sub-evc — EVC Coordinator (41) gets their own sub-EVCs
        [HttpGet("api/admin/evc/my-sub-evc")]
        public IActionResult GetMySubList()
        {
            if (!IsAdminOrEVC()) return Forbid();
            return Ok(_svc.GetSubEvcList(GetUserId()));
        }

        [HttpGet("api/admin/sub-evc/{id:long}")]
        public IActionResult GetSubDetails(long id)
        {
            if (!IsAdminOrEVC()) return Forbid();
            return Ok(_svc.GetSubEvcDetails(id));
        }

        [HttpPost("api/admin/sub-evc")]
        public IActionResult SaveSub([FromBody] SaveEvcRequest req)
        {
            if (!IsAdminOrEVC()) return Forbid();
            if (req == null) return BadRequest(new SaveEvcResponse { Success = false, Message = "Invalid request." });
            return Ok(_svc.SaveSubEvc(req, GetLoginId(), GetIp()));
        }

        [HttpPost("api/admin/sub-evc/{id:long}/activate")]
        public IActionResult ActivateSub(long id)
        {
            if (!IsAdminOrEVC()) return Forbid();
            return Ok(_svc.ActivateSubEvc(id, GetLoginId(), GetIp()));
        }

        [HttpPost("api/admin/sub-evc/{id:long}/deactivate")]
        public IActionResult DeactivateSub(long id)
        {
            if (!IsAdminOrEVC()) return Forbid();
            return Ok(_svc.DeactivateSubEvc(id, GetLoginId(), GetIp()));
        }
    }
}
