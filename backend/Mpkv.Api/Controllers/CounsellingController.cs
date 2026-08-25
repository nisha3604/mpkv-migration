using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Models.College;
using Mpkv.Api.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    /// <summary>
    /// Counselling endpoints — Spot Round (UserTypeID 31 or 61 only)
    /// Mirrors: Counselling/CheckApplicationID.aspx
    /// </summary>
    [ApiController]
    [Route("api/counselling")]
    [Authorize]
    public class CounsellingController : ControllerBase
    {
        private readonly ICounsellingService _service;
        public CounsellingController(ICounsellingService service) => _service = service;

        private int    GetUserTypeId() => int.Parse(User.FindFirstValue("UserTypeID") ?? "0");
        private int    GetCourseId()   => int.Parse(User.FindFirstValue("CourseID")   ?? "0");
        private int    GetDistrictId() => int.Parse(User.FindFirstValue("DistrictID") ?? "0");
        private string GetLoginId()    => User.FindFirstValue(JwtRegisteredClaimNames.UniqueName) ?? "";

        // GET /api/counselling/phases
        // Loads phases + access check + college CourseID restriction
        [HttpGet("phases")]
        public IActionResult GetPhases()
        {
            var result = _service.GetPhases(GetUserTypeId(), GetCourseId(), GetLoginId());
            return Ok(result);
        }

        // POST /api/counselling/check
        // Body: { applicationId, phaseId, flag }
        [HttpPost("check")]
        public IActionResult Check([FromBody] CounsellingCheckRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ApplicationID))
                return Ok(new CounsellingCheckResponse { Success = false, Message = "Please Enter Application Number." });

            var result = _service.Check(
                request.ApplicationID,
                request.PhaseID,
                request.Flag,
                GetUserTypeId(),
                GetCourseId(),
                GetDistrictId(),
                GetLoginId());

            return Ok(result);
        }
    }
}
