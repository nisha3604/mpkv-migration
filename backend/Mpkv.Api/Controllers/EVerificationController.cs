using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.EVerification;
using Mpkv.Api.Services;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    /// <summary>
    /// EVerification Portal — mirrors EVerification/ pages from old project.
    /// Access: UserTypeID 41 (EVC Supervisor) or 42 (Sub-EVC) only.
    ///
    /// GET  /api/everification/dashboard
    /// GET  /api/everification/candidates?status=NotVerified
    /// GET  /api/everification/check-application?appId=2026101042
    /// POST /api/everification/allot
    /// GET  /api/everification/documents/{candidateId}
    /// POST /api/everification/verify
    /// </summary>
    [ApiController]
    [Route("api/everification")]
    [Authorize]
    public class EVerificationController : ControllerBase
    {
        private readonly IEVerificationService _svc;
        public EVerificationController(IEVerificationService svc) => _svc = svc;

        private int    GetUserTypeId() => int.TryParse(User.FindFirstValue("UserTypeID") ?? "0", out var v) ? v : 0;
        private string GetLoginId()    => User.FindFirstValue(ClaimTypes.Name) ?? "";
        private long   GetUserId()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "0";
            return long.TryParse(sub, out var v) ? v : 0;
        }
        private string GetIp() => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        private bool   IsEVC() => UserTypeHelper.IsEVC(GetUserTypeId());

        // GET /api/everification/dashboard
        [HttpGet("dashboard")]
        public IActionResult GetDashboard()
        {
            if (!IsEVC()) return Forbid();
            return Ok(_svc.GetDashboard(GetUserId(), GetLoginId(), GetUserTypeId()));
        }

        // GET /api/everification/candidates?status=NotVerified
        [HttpGet("candidates")]
        public IActionResult GetCandidates([FromQuery] string status = "NotVerified")
        {
            if (!IsEVC()) return Forbid();
            return Ok(_svc.GetCandidateList(status, GetLoginId()));
        }

        // GET /api/everification/check-application?appId=2026101042
        [HttpGet("check-application")]
        public IActionResult CheckApplication([FromQuery] string appId)
        {
            if (!IsEVC()) return Forbid();
            if (string.IsNullOrWhiteSpace(appId))
                return BadRequest(new EVCheckAppIDResponse { Success = false, Message = "Application ID is required." });
            return Ok(_svc.CheckApplicationID(appId, GetLoginId()));
        }

        // POST /api/everification/allot
        // Body: { candidateId: 12345 }
        [HttpPost("allot")]
        public IActionResult Allot([FromBody] EVAllotRequest req)
        {
            if (!IsEVC()) return Forbid();
            if (req == null || req.CandidateID == 0)
                return BadRequest(new EVAllotResponse { Success = false, Message = "Candidate ID is required." });
            return Ok(_svc.AllotCandidate(req.CandidateID, GetUserId(), GetLoginId(), GetIp()));
        }

        // GET /api/everification/documents/{candidateId}
        [HttpGet("documents/{candidateId:long}")]
        public IActionResult GetDocuments(long candidateId)
        {
            if (!IsEVC()) return Forbid();
            return Ok(_svc.GetDocuments(candidateId, GetLoginId()));
        }

        // POST /api/everification/verify
        [HttpPost("verify")]
        public IActionResult SaveVerification([FromBody] EVSaveVerificationRequest req)
        {
            if (!IsEVC()) return Forbid();
            if (req == null) return BadRequest(new EVSaveVerificationResponse { Success = false, Message = "Invalid request." });
            return Ok(_svc.SaveVerification(req, GetLoginId(), GetIp()));
        }

        // GET /api/everification/reports/evc-wise
        [HttpGet("reports/evc-wise")]
        public IActionResult GetEVCWiseReport()
        {
            if (!IsEVC()) return Forbid();
            return Ok(_svc.GetEVCWiseReport());
        }

        // GET /api/everification/reports/evc-candidates?evcId=10001&flag=A
        [HttpGet("reports/evc-candidates")]
        public IActionResult GetEVCWiseCandidates([FromQuery] long evcId, [FromQuery] string flag = "A")
        {
            if (!IsEVC()) return Forbid();
            return Ok(_svc.GetEVCWiseCandidateList(evcId, flag));
        }

        // GET /api/everification/reports/eligible?courseId=0
        [HttpGet("reports/eligible")]
        public IActionResult GetEligibleCandidates([FromQuery] short courseId = 0)
        {
            if (!IsEVC()) return Forbid();
            return Ok(_svc.GetEligibleCandidates(GetLoginId(), courseId));
        }
    }

    // Simple allot request model (not worth a separate models file)
    public class EVAllotRequest
    {
        public long CandidateID { get; set; }
    }
}
