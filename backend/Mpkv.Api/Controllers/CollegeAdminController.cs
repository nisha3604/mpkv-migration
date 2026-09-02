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
    /// Admin-only college management endpoints.
    /// Mirrors: CollegeList.aspx, GetCollegePassword.aspx, ResetCollegePassword.aspx
    /// All endpoints require UserTypeID 11 or 12 — others get 403.
    /// </summary>
    [ApiController]
    [Route("api/admin/college")]
    [Authorize]
    public class CollegeAdminController : ControllerBase
    {
        private readonly ICollegeService _collegeService;

        public CollegeAdminController(ICollegeService collegeService) => _collegeService = collegeService;

        private int    GetUserTypeId() => int.Parse(User.FindFirstValue("UserTypeID") ?? "0");
        private string GetLoginId()    => User.FindFirstValue(ClaimTypes.Name) ?? "";
        private string GetIp()         => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        private bool   IsAdmin()       => UserTypeHelper.IsAdmin(GetUserTypeId());

        // GET /api/admin/college/list?courseID=&districtID=&collegeCode=&collegeName=
        [HttpGet("list")]
        public IActionResult GetList([FromQuery] CollegeListRequest request)
        {
            if (!IsAdmin()) return Forbid();
            var result = _collegeService.GetList(request ?? new CollegeListRequest());
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // GET /api/admin/college/passwords?districtID=&collegeCode=&collegeName=
        [HttpGet("passwords")]
        public IActionResult GetPasswords([FromQuery] CollegeListRequest request)
        {
            if (!IsAdmin()) return Forbid();
            var result = _collegeService.GetPasswordList(request ?? new CollegeListRequest());
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // GET /api/admin/college/current-password/{collegeCode}
        [HttpGet("current-password/{collegeCode}")]
        public IActionResult GetCurrentPassword(string collegeCode)
        {
            if (!IsAdmin()) return Forbid();
            var result = _collegeService.GetCurrentPassword(collegeCode);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // POST /api/admin/college/reset-password
        [HttpPost("reset-password")]
        public IActionResult ResetPassword([FromBody] ResetCollegePasswordRequest request)
        {
            if (!IsAdmin()) return Forbid();
            if (request == null) return BadRequest(new ResetCollegePasswordResponse { Success = false, Message = "Invalid request." });
            var result = _collegeService.ResetPassword(request, GetLoginId(), GetIp());
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
