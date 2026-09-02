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
        private string GetLoginId()    => User.FindFirstValue(ClaimTypes.Name) ?? "";
        private string GetIp()         => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

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

        // ── Admission Summary ─────────────────────────────────────────────
        [HttpPost("admission-summary")]
        public IActionResult GetAdmissionSummary([FromBody] AdmissionSummaryRequest req)
        {
            if (req == null) return BadRequest(new AdmissionSummaryResponse { Message = "Invalid request." });
            var result = _service.GetAdmissionSummary(req.CandidateID, req.CollegeID, req.PhaseID, GetLoginId(), req.Flag);
            return Ok(result);
        }

        // ── Confirm Admission ─────────────────────────────────────────────
        [HttpPost("confirm")]
        public IActionResult ConfirmAdmission([FromBody] ConfirmAdmissionRequest req)
        {
            if (req == null) return BadRequest(new AdmissionActionResponse { Message = "Invalid request." });
            var result = _service.ConfirmAdmission(req, GetLoginId(), GetIp());
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ── Reject Admission ──────────────────────────────────────────────
        [HttpPost("reject")]
        public IActionResult RejectAdmission([FromBody] ConfirmAdmissionRequest req)
        {
            if (req == null) return BadRequest(new AdmissionActionResponse { Message = "Invalid request." });
            var result = _service.RejectAdmission(req, GetLoginId(), GetIp());
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ── Cancel Admission ──────────────────────────────────────────────
        [HttpPost("cancel-action")]
        public IActionResult CancelAdmission([FromBody] ConfirmAdmissionRequest req)
        {
            if (req == null) return BadRequest(new AdmissionActionResponse { Message = "Invalid request." });
            var result = _service.CancelAdmission(req, GetLoginId(), GetIp());
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ── Upload document during admission ──────────────────────────────
        [HttpPost("upload-document")]
        [RequestSizeLimit(5 * 1024 * 1024)]
        public async Task<IActionResult> UploadDocument([FromForm] UploadAdmissionDocRequest req, [FromForm] IFormFile file)
        {
            if (req == null || file == null) return BadRequest(new AdmissionActionResponse { Message = "Invalid request." });
            var result = await _service.UploadAdmissionDocument(req, file, GetLoginId(), GetIp());
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
