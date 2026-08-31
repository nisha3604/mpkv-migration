using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Models.College;
using Mpkv.Api.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    /// <summary>
    /// Allotment endpoints — used by College (61) and Admin (11/12).
    /// Mirrors: CheckAllotmentStatus.aspx
    /// </summary>
    [ApiController]
    [Route("api/admission")]
    [Authorize]
    public class AllotmentController : ControllerBase
    {
        private readonly IAllotmentService _allotmentService;
        public AllotmentController(IAllotmentService allotmentService) => _allotmentService = allotmentService;

        private int    GetUserTypeId()  => int.Parse(User.FindFirstValue("UserTypeID") ?? "0");
        private string GetLoginId()     => User.FindFirstValue(JwtRegisteredClaimNames.UniqueName) ?? "";
        private string GetIp()          => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        private long   GetCandidateId() => long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0", out var id) ? id : 0;

        // GET /api/admission/phases
        // Returns phase dropdown + current phase ID
        [HttpGet("phases")]
        public IActionResult GetPhases()
        {
            var result = _allotmentService.GetPhaseList(GetUserTypeId(), GetLoginId());
            return result.Success ? Ok(result) : Ok(result); // always 200 — empty list is valid
        }

        // POST /api/admission/allotment-status
        // Body: { applicationId, phaseId }
        [HttpPost("allotment-status")]
        public IActionResult GetAllotmentStatus([FromBody] CheckAllotmentRequest request)
        {
            if (request == null)
                return BadRequest(new AllotmentStatusResponse { Success = false, Message = "Invalid request." });
            var result = _allotmentService.GetAllotmentStatus(request.ApplicationID, request.PhaseID, GetUserTypeId(), GetLoginId());
            return result.Success ? Ok(result) : Ok(result); // always 200 with success=false+message
        }

        // POST /api/admission/download-allotment-letter
        // Marks letter as downloaded, returns print URL
        [HttpPost("download-allotment-letter")]
        public IActionResult DownloadAllotmentLetter([FromBody] DownloadAllotmentLetterRequest request)
        {
            if (request == null || request.CandidateID <= 0)
                return BadRequest(new DownloadAllotmentLetterResponse { Success = false, Message = "Invalid request." });
            var result = _allotmentService.SaveDownloadStatus(request.CandidateID, request.CollegeID, request.PhaseID, GetLoginId(), GetIp());
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // POST /api/admission/refusal-fee
        // Initiates refusal fee payment → returns gateway URL
        [HttpPost("refusal-fee")]
        public IActionResult InitiateRefusalFee([FromBody] RefusalFeeInitiateRequest request)
        {
            if (request == null || request.CandidateID <= 0)
                return BadRequest(new RefusalFeeInitiateResponse { Success = false, Message = "Invalid request." });
            var result = _allotmentService.InitiateRefusalFee(request.CandidateID, request.PhaseID, request.PaymentGatewayID, GetLoginId(), GetIp());
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ── Allotment Summary ─────────────────────────────────────────────────
        // GET /api/admission/allotment-summary
        // Mirrors: AllotmentSummary.aspx — auto-loads for candidate (UserTypeID=91)
        [HttpGet("allotment-summary")]
        public IActionResult GetAllotmentSummary()
        {
            var candidateId = GetCandidateId();
            if (candidateId <= 0) return Unauthorized();
            var result = _allotmentService.GetAllotmentSummary(candidateId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ── Category Conversion Fee ───────────────────────────────────────────
        // GET  /api/admission/category-conversion-fee
        // POST /api/admission/category-conversion-fee/initiate
        [HttpGet("category-conversion-fee")]
        public IActionResult GetCategoryConversionFee()
        {
            var candidateId = GetCandidateId();
            if (candidateId <= 0) return Unauthorized();
            var result = _allotmentService.GetCategoryConversionFeeDetails(candidateId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("category-conversion-fee/initiate")]
        public IActionResult InitiateCategoryConversionFee([FromBody] RefusalFeeInitiateRequest? request)
        {
            if (request == null || request.PhaseID <= 0 || request.PaymentGatewayID <= 0)
                return BadRequest(new RefusalFeeInitiateResponse { Success = false, Message = "Invalid request." });
            var candidateId = GetCandidateId();
            if (candidateId <= 0) return Unauthorized();
            var result = _allotmentService.InitiateCategoryConversionFee(candidateId, request.PhaseID, request.PaymentGatewayID, GetLoginId(), GetIp());
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
