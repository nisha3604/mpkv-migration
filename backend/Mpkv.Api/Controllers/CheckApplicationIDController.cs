using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Models.College;
using Mpkv.Api.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    /// <summary>
    /// Mirrors CheckApplicationID.aspx — single endpoint for all 5 flags.
    /// GET  /api/admission/phases         ← already in AllotmentController
    /// POST /api/admission/check-application-id
    /// </summary>
    [ApiController]
    [Route("api/admission")]
    [Authorize]
    public class CheckApplicationIDController : ControllerBase
    {
        private readonly ICheckApplicationIDService _service;
        private readonly IAllotmentService          _allotmentService;

        public CheckApplicationIDController(ICheckApplicationIDService service, IAllotmentService allotmentService)
        {
            _service          = service;
            _allotmentService = allotmentService;
        }

        private int    GetUserTypeId() => int.Parse(User.FindFirstValue("UserTypeID") ?? "0");
        private string GetLoginId()    => User.FindFirstValue(JwtRegisteredClaimNames.UniqueName) ?? "";

        // POST /api/admission/check-application-id
        // Body: { applicationId, phaseId, flag }
        [HttpPost("check-application-id")]
        public IActionResult CheckApplicationID([FromBody] CheckApplicationIDRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ApplicationID))
                return BadRequest(new CheckApplicationIDResponse { Success = false, Message = "Please Enter Application ID." });

            if (string.IsNullOrWhiteSpace(request.Flag))
                return BadRequest(new CheckApplicationIDResponse { Success = false, Message = "Invalid request flag." });

            var result = _service.Search(
                request.ApplicationID,
                request.PhaseID,
                request.Flag,
                GetUserTypeId(),
                GetLoginId());

            // Always return 200 — error shown inline like old ShowMessage()
            return Ok(result);
        }
    }
}
