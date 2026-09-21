using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.Admin;
using Mpkv.Api.Services;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
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

        // GET /api/admin/candidates/{appId}/application
        [HttpGet("{appId}/application")]
        public IActionResult GetApplication(string appId)
        {
            if (!IsAdminOrEVC()) return Forbid();
            if (string.IsNullOrWhiteSpace(appId))
                return BadRequest(new { success = false, message = "Application ID is required." });
            var pwdInfo = _svc.GetPasswordInfo(appId);
            if (!pwdInfo.Success || pwdInfo.CandidateID == 0)
                return Ok(new { success = false, message = $"Candidate not found for Application ID: {appId}" });
            var result = _appSvc.GetApplicationFormSummary(pwdInfo.CandidateID, GetLoginId());
            return Ok(new { success = result.Status.CandidateID > 0, data = result });
        }

        // POST /api/admin/candidates/{appId}/unlock
        [HttpPost("{appId}/unlock")]
        public IActionResult UnlockForm(string appId)
        {
            if (!IsAdmin()) return Forbid();
            if (string.IsNullOrWhiteSpace(appId))
                return BadRequest(new UnlockCandidateFormResponse { Success = false, Message = "Application ID is required." });
            var result = _svc.UnlockCandidateForm(appId, GetLoginId(), GetIp());
            return Ok(result);
        }

        // POST /api/admin/candidates/change-mobile-email
        [HttpPost("change-mobile-email")]
        public IActionResult ChangeMobileEmail([FromBody] ChangeMobileEmailRequest req)
        {
            if (!IsAdmin()) return Forbid();
            if (req == null || string.IsNullOrWhiteSpace(req.ApplicationId))
                return BadRequest(new ChangeMobileEmailResponse { Success = false, Message = "Application ID is required." });
            if (string.IsNullOrWhiteSpace(req.NewMobile) && string.IsNullOrWhiteSpace(req.NewEmail))
                return BadRequest(new ChangeMobileEmailResponse { Success = false, Message = "Please provide a new mobile number or e-mail ID." });
            return Ok(_svc.ChangeMobileEmail(req.ApplicationId, req.NewMobile, req.NewEmail, GetLoginId(), GetIp()));
        }

        // GET /api/admin/candidates/{appId}/security-question
        // Returns security question list + current selection for the candidate
        [HttpGet("{appId}/security-question")]
        public IActionResult GetSecurityQuestion(string appId)
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetSecurityQuestionDetails(appId));
        }

        // POST /api/admin/candidates/change-security-question
        // Mirrors Admin/CheckApplicationID.aspx?Flag=ChangeSecurityQuestion → Candidate/ChangeSecurityQuestion.aspx
        [HttpPost("change-security-question")]
        public IActionResult ChangeSecurityQuestion([FromBody] AdminChangeSecurityQuestionRequest req)
        {
            if (!IsAdmin()) return Forbid();
            if (req == null || string.IsNullOrWhiteSpace(req.ApplicationId))
                return BadRequest(new ChangeMobileEmailResponse { Success = false, Message = "Application ID is required." });
            if (req.SecurityQuestionId <= 0)
                return BadRequest(new ChangeMobileEmailResponse { Success = false, Message = "Please select a security question." });
            if (string.IsNullOrWhiteSpace(req.Answer))
                return BadRequest(new ChangeMobileEmailResponse { Success = false, Message = "Please enter the answer." });
            return Ok(_svc.ChangeSecurityQuestion(req.ApplicationId, req.SecurityQuestionId, req.Answer, GetLoginId(), GetIp()));
        }
    }
}
