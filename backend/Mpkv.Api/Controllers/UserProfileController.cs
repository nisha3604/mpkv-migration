using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Models.College;
using Mpkv.Api.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    /// <summary>
    /// User profile endpoints — mirrors Administration/EditUserProfile.aspx
    /// All user types (11, 12, 61, 91) can update their own profile.
    /// UserID always taken from JWT — user can only edit their own profile.
    /// </summary>
    [ApiController]
    [Route("api/profile")]
    [Authorize]
    public class UserProfileController : ControllerBase
    {
        private readonly IUserProfileService _service;
        public UserProfileController(IUserProfileService service) => _service = service;

        private long   GetUserId()     => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? "0");
        private int    GetUserTypeId() => int.Parse(User.FindFirstValue("UserTypeID") ?? "0");
        private string GetLoginId()    => User.FindFirstValue(JwtRegisteredClaimNames.UniqueName) ?? "";
        private string GetIp()         => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

        // GET /api/profile
        // Mirrors: Page_Load → GetUserDetails(user.UserID)
        [HttpGet]
        public IActionResult GetProfile()
        {
            var userId = GetUserId();
            if (userId <= 0) return Unauthorized();
            var result = _service.GetUserDetails(userId);
            return Ok(result);
        }

        // POST /api/profile
        // Mirrors: btnSave_Click → EditUser(entity)
        [HttpPost]
        public IActionResult SaveProfile([FromBody] SaveUserProfileRequest request)
        {
            if (request == null)
                return BadRequest(new SaveUserProfileResponse { Success = false, Message = "Invalid request." });
            var userId = GetUserId();
            if (userId <= 0) return Unauthorized();
            var result = _service.EditUser(userId, GetUserTypeId(), GetLoginId(), GetIp(), request);
            return Ok(result);
        }
    }
}
