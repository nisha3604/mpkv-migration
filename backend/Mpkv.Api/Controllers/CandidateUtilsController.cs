using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.Admin;
using Mpkv.Api.Services;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    /// <summary>
    /// Admin candidate utilities — mirrors Admin/SearchCandidate.aspx,
    ///   Admin/ResetCandidatePassword.aspx, Admin/CheckDocumentVerificationStatus.aspx
    /// Access: UserTypeID 11 or 12 only.
    ///
    /// POST /api/admin/candidates/search
    /// GET  /api/admin/candidates/{appId}/password-info
    /// POST /api/admin/candidates/reset-password
    /// GET  /api/admin/candidates/{id}/doc-status
    /// GET  /api/admin/candidates/{id}/application   ← NEW: full read-only application view
    /// </summary>
    [ApiController]
    [Route("api/admin/candidates")]
    [Authorize]
    public class CandidateUtilsController : ControllerBase
    {
        private readonly ICandidateUtilsService   _svc;
        private readonly IApplicationFormService  _appSvc;

        public CandidateUtilsController(ICandidateUtilsService svc, IApplicationFormService appSvc)
        {
            _svc    = svc;
            _appSvc = appSvc;
        }

        private int    GetUserTypeId() => int.TryParse(User.FindFirstValue("UserTypeID") ?? "0", out var v) ? v : 0;
        private string GetLoginId()    => User.FindFirstValue(ClaimTypes.Name) ?? "";
        private string GetIp()         => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        private bool   IsAdmin()       => UserTypeHelper.IsAdmin(GetUserTypeId());
        private bool   IsAdminOrEVC()  => UserTypeHelper.IsAdmin(GetUserTypeId()) || UserTypeHelper.IsEVC(GetUserTypeId());

        // POST /api/admin/candidates/search
        [HttpPost("search")]
        public IActionResult Search([FromBody] SearchCandidateRequest req)
        {
            if (!IsAdmin()) return Forbid();
            if (req == null) return BadRequest(new SearchCandidateResponse { Success = false, Message = "Invalid request." });
            return Ok(_svc.Search(req));
        }

        // GET /api/admin/candidates/{appId}/password-info
        [HttpGet("{appId}/password-info")]
        public IActionResult GetPasswordInfo(string appId)
        {
            if (!IsAdminOrEVC()) return Forbid();
            return Ok(_svc.GetPasswordInfo(appId));
        }

        // POST /api/admin/candidates/reset-password
        [HttpPost("reset-password")]
        public IActionResult ResetPassword([FromBody] ResetCandidatePasswordRequest req)
        {
            if (!IsAdmin()) return Forbid();
            if (req == null) return BadRequest(new ResetCandidatePasswordResponse { Success = false, Message = "Invalid request." });
            var r = _svc.ResetPassword(req, GetLoginId(), GetIp());
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // GET /api/admin/candidates/{id}/doc-status
        [HttpGet("{id:long}/doc-status")]
        public IActionResult GetDocStatus(long id)
        {
            if (!IsAdminOrEVC()) return Forbid();
            return Ok(_svc.GetDocVerificationStatus(id, GetLoginId()));
        }

        // GET /api/admin/candidates/{id}/application
        // Returns full read-only application summary — allowed for admin AND EVC
        [HttpGet("{appId}/application")]
        public IActionResult GetApplication(string appId)
        {
            if (!IsAdminOrEVC()) return Forbid();
            if (string.IsNullOrWhiteSpace(appId))
                return BadRequest(new { success = false, message = "Application ID is required." });

            // Step 1 — resolve ApplicationID → CandidateID
            var pwdInfo = _svc.GetPasswordInfo(appId);
            if (!pwdInfo.Success || pwdInfo.CandidateID == 0)
                return Ok(new { success = false, message = $"Candidate not found for Application ID: {appId}" });

            // Step 2 — fetch full application summary using CandidateID
            var result = _appSvc.GetApplicationFormSummary(pwdInfo.CandidateID, GetLoginId());
            return Ok(new { success = result.Status.CandidateID > 0, data = result });
        }

        // POST /api/admin/candidates/{appId}/unlock
        // Admin override — unlocks a locked application form without requiring fee payment.
        // Mirrors ApplicationFormUnlock.aspx.cs CloseConfirmBoxYes (admin branch).
        // SP: ApplicationForm_UnlockForm(@CandidateID, @UserLoginID=adminLoginId, @IPAddress, @PageCode)
        [HttpPost("{appId}/unlock")]
        public IActionResult UnlockForm(string appId)
        {
            if (!IsAdmin()) return Forbid();
            if (string.IsNullOrWhiteSpace(appId))
                return BadRequest(new UnlockCandidateFormResponse { Success = false, Message = "Application ID is required." });

            var result = _svc.UnlockCandidateForm(appId, GetLoginId(), GetIp());
            return Ok(result);
        }
    }
}
