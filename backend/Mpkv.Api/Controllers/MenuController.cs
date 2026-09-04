using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.Menu;
using Mpkv.Api.Services;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    [ApiController]
    [Route("api/menu")]
    public class MenuController : ControllerBase
    {
        private readonly IMenuService _menuService;
        private const short REGION_ID = 1;

        public MenuController(IMenuService menuService) => _menuService = menuService;

        private int    GetUserTypeId()  => int.TryParse(User.FindFirstValue("UserTypeID") ?? "0", out var v) ? v : 0;
        private string GetLoginId()     => User.FindFirstValue(ClaimTypes.Name) ?? "";
        private string GetIp()          => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        private bool   IsAdmin()        => UserTypeHelper.IsAdmin(GetUserTypeId());

        // ── Public nav (no auth) — UserTypeID=0 ───────────────────────────────
        // GET /api/menu/public?lang=en
        [HttpGet("public")]
        [AllowAnonymous]
        public IActionResult GetPublicMenu([FromQuery] string lang = "")
            => Ok(_menuService.GetMenu(REGION_ID, 0, "", lang));

        // ── Logged-in nav — reads UserTypeID + LoginID from JWT ───────────────
        // GET /api/menu?lang=en
        [HttpGet]
        [Authorize]
        public IActionResult GetMenu([FromQuery] string lang = "")
            => Ok(_menuService.GetMenu(REGION_ID, GetUserTypeId(), GetLoginId(), lang));

        // ══════════════════════════════════════════════════════════════════════
        // ADMIN MANAGEMENT — all require UserTypeID 11 or 12
        // ══════════════════════════════════════════════════════════════════════

        // GET /api/menu/admin/list?userTypeId=61&parentMenuId=0
        [HttpGet("admin/list")]
        [Authorize]
        public IActionResult GetMenusList([FromQuery] int userTypeId, [FromQuery] int parentMenuId = 0)
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_menuService.GetMenusList(REGION_ID, userTypeId, parentMenuId));
        }

        // GET /api/menu/admin/{menuId}
        [HttpGet("admin/{menuId:int}")]
        [Authorize]
        public IActionResult GetMenuDetails(int menuId)
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_menuService.GetMenuDetails(menuId));
        }

        // POST /api/menu/admin
        [HttpPost("admin")]
        [Authorize]
        public IActionResult SaveMenu([FromBody] SaveMenuRequest req)
        {
            if (!IsAdmin()) return Forbid();
            if (req == null) return BadRequest(new SaveMenuResponse { Success = false, Message = "Invalid request." });
            var r = _menuService.SaveMenuDetails(REGION_ID, req, GetLoginId(), GetIp());
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // DELETE /api/menu/admin/{menuId}
        [HttpDelete("admin/{menuId:int}")]
        [Authorize]
        public IActionResult DeleteMenu(int menuId)
        {
            if (!IsAdmin()) return Forbid();
            var r = _menuService.DeleteMenu(menuId, GetLoginId(), GetIp());
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // POST /api/menu/admin/reorder
        [HttpPost("admin/reorder")]
        [Authorize]
        public IActionResult ReorderMenus([FromBody] ReorderMenuRequest req)
        {
            if (!IsAdmin()) return Forbid();
            if (req == null) return BadRequest(new SaveMenuResponse { Success = false, Message = "Invalid request." });
            var r = _menuService.ReorderMenus(req, GetLoginId(), GetIp());
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // GET /api/menu/admin/groups?userTypeId=61
        [HttpGet("admin/groups")]
        [Authorize]
        public IActionResult GetGroups([FromQuery] int userTypeId)
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_menuService.GetGroupsList(REGION_ID, userTypeId));
        }

        // GET /api/menu/admin/available?userTypeId=61&parentMenuId=0
        [HttpGet("admin/available")]
        [Authorize]
        public IActionResult GetAvailableLinks([FromQuery] int userTypeId, [FromQuery] int parentMenuId = 0)
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_menuService.GetAvailableLinks(REGION_ID, userTypeId, parentMenuId));
        }

        // GET /api/menu/admin/links?directory=Candidate
        [HttpGet("admin/links")]
        [Authorize]
        public IActionResult GetLinks([FromQuery] string directory = "")
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_menuService.GetLinksList(directory));
        }

        // GET /api/menu/admin/links/{linkId}
        [HttpGet("admin/links/{linkId:int}")]
        [Authorize]
        public IActionResult GetLinkDetails(int linkId)
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_menuService.GetLinkDetails(linkId));
        }

        // POST /api/menu/admin/links
        [HttpPost("admin/links")]
        [Authorize]
        public IActionResult SaveLink([FromBody] SaveLinkRequest req)
        {
            if (!IsAdmin()) return Forbid();
            if (req == null) return BadRequest(new SaveMenuResponse { Success = false, Message = "Invalid request." });
            var r = _menuService.SaveLinkDetails(req, GetLoginId(), GetIp());
            return r.Success ? Ok(r) : BadRequest(r);
        }
    }
}
