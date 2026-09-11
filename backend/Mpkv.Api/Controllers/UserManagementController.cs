using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.Admin;
using Mpkv.Api.Services;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    /// <summary>
    /// User Management — mirrors ManageUsers.aspx + AddEditUsers.aspx.
    /// Access: UserTypeID 11 or 12 only.
    ///
    /// GET  /api/admin/users/types             → user type dropdown (filtered by caller role)
    /// GET  /api/admin/users?userTypeId=       → user list for selected type
    /// GET  /api/admin/users/{id}              → single user details (for edit pre-fill)
    /// POST /api/admin/users                   → add new user (UserID=0, auto-generates password)
    /// PUT  /api/admin/users/{id}              → edit user profile (name/mobile/email)
    /// POST /api/admin/users/{id}/toggle       → activate / deactivate
    /// POST /api/admin/users/{id}/send-sms     → send login ID + password via SMS
    /// </summary>
    [ApiController]
    [Route("api/admin/users")]
    [Authorize]
    public class UserManagementController : ControllerBase
    {
        private readonly IUserManagementService _svc;
        private const short REGION_ID = 1;

        public UserManagementController(IUserManagementService svc) => _svc = svc;

        private int    GetUserTypeId() => int.TryParse(User.FindFirstValue("UserTypeID") ?? "0", out var v) ? v : 0;
        private string GetLoginId()    => User.FindFirstValue(ClaimTypes.Name) ?? "";
        private string GetIp()         => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        private bool   IsAdmin()       => UserTypeHelper.IsAdmin(GetUserTypeId());

        // GET /api/admin/users/types
        [HttpGet("types")]
        public IActionResult GetUserTypes()
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetUserTypes(GetUserTypeId()));
        }

        // GET /api/admin/users?userTypeId=X
        [HttpGet]
        public IActionResult GetUserList([FromQuery] int userTypeId = -1)
        {
            if (!IsAdmin()) return Forbid();
            if (userTypeId <= 0)
                return Ok(new UserListResponse { Success = true, Message = "Please select a user type.", Items = new() });
            return Ok(_svc.GetUserList(userTypeId));
        }

        // GET /api/admin/users/{id}
        [HttpGet("{id:long}")]
        public IActionResult GetUserDetails(long id)
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetUserDetails(id));
        }

        // POST /api/admin/users  (add — UserID must be 0)
        [HttpPost]
        public IActionResult AddUser([FromBody] SaveUserRequest req)
        {
            if (!IsAdmin()) return Forbid();
            if (req == null) return BadRequest(new SaveUserResponse { Success = false, Message = "Invalid request." });
            req.UserID = 0; // enforce add
            var r = _svc.SaveUser(req, GetLoginId(), GetIp(), REGION_ID);
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // PUT /api/admin/users/{id}  (edit)
        [HttpPut("{id:long}")]
        public IActionResult EditUser(long id, [FromBody] SaveUserRequest req)
        {
            if (!IsAdmin()) return Forbid();
            if (req == null) return BadRequest(new SaveUserResponse { Success = false, Message = "Invalid request." });
            req.UserID = id; // enforce edit
            var r = _svc.SaveUser(req, GetLoginId(), GetIp(), REGION_ID);
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // POST /api/admin/users/{id}/toggle
        [HttpPost("{id:long}/toggle")]
        public IActionResult ToggleActive(long id)
        {
            if (!IsAdmin()) return Forbid();
            var r = _svc.ToggleActive(id, GetLoginId(), GetIp());
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // POST /api/admin/users/{id}/send-sms
        [HttpPost("{id:long}/send-sms")]
        public IActionResult SendSms(long id, [FromBody] SendSmsRequest req)
        {
            if (!IsAdmin()) return Forbid();
            var r = _svc.SendSms(id, req?.UserLoginId ?? "");
            return r.Success ? Ok(r) : BadRequest(r);
        }
    }

    public class SendSmsRequest { public string UserLoginId { get; set; } = ""; }
}
