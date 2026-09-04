using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Mpkv.Api.Models.Candidate;
using Mpkv.Api.Services;

namespace Mpkv.Api.Controllers
{
    [ApiController]
    [Route("api/account")]
    public class AccountRecoveryController : ControllerBase
    {
        private readonly IAccountRecoveryService _accountService;
        public AccountRecoveryController(IAccountRecoveryService accountService) => _accountService = accountService;

        [HttpGet("masters")]                             public IActionResult GetMasters() => Ok(_accountService.GetMasters());
        [HttpPost("forgot-login-id/send-otp")]          public IActionResult ForgotLoginIdSendOtp([FromBody] ForgotLoginIdRequest req) { if (req == null) return BadRequest(new ForgotLoginIdResponse { Success=false, Message="Invalid request." }); var r = _accountService.SendForgotLoginIdOtp(req); return r.Success ? Ok(r) : BadRequest(r); }
        [HttpPost("forgot-login-id/verify-otp")]        public IActionResult ForgotLoginIdVerifyOtp([FromBody] ForgotLoginIdVerifyOtpRequest req) { if (req == null) return BadRequest(new ForgotLoginIdResponse { Success=false, Message="Invalid request." }); var r = _accountService.VerifyForgotLoginIdOtp(req); return r.Success ? Ok(r) : BadRequest(r); }
        [HttpPost("reset-password-by-security-question")] public IActionResult ResetBySecurityQuestion([FromBody] ResetBySecurityQuestionRequest req) { if (req == null) return BadRequest(new ResetBySecurityQuestionResponse { Success=false, Message="Invalid request." }); var r = _accountService.CheckBySecurityQuestion(req); return r.Success ? Ok(r) : BadRequest(r); }
        [HttpPost("send-otp/mobile")]                   public IActionResult SendOtpMobile([FromBody] CheckAndSendOtpMobileRequest req) { if (req == null) return BadRequest(new SendOtpResponse { Success=false, Message="Invalid request." }); var r = _accountService.CheckAndSendOtpMobile(req); return r.Success ? Ok(r) : BadRequest(r); }
        [HttpPost("send-otp/email")]                    public IActionResult SendOtpEmail([FromBody] CheckAndSendOtpEmailRequest req) { if (req == null) return BadRequest(new SendOtpResponse { Success=false, Message="Invalid request." }); var r = _accountService.CheckAndSendOtpEmail(req); return r.Success ? Ok(r) : BadRequest(r); }
        [HttpPost("verify-otp")]                        public IActionResult VerifyOtp([FromBody] VerifyOtpRequest req) { if (req == null) return BadRequest(new VerifyOtpResponse { Success=false, Message="Invalid request." }); var r = _accountService.VerifyOtp(req); return r.Success ? Ok(r) : BadRequest(r); }
        [HttpPost("reset-password")]                    public IActionResult ResetPassword([FromBody] ResetPasswordRequest req) { if (req == null) return BadRequest(new ResetPasswordResponse { Success=false, Message="Invalid request." }); var r = _accountService.ResetPassword(req, HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"); return r.Success ? Ok(r) : BadRequest(r); }

        // ── Miscellaneous — Change Password / Mobile / Email / Security Question ──
        [HttpPost("change-password"), Authorize]
        public IActionResult ChangePassword([FromBody] ChangePasswordRequest req)
        {
            if (req == null) return BadRequest(new AccountChangeResponse { Success=false, Message="Invalid request." });
            var userId      = long.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0", out var id) ? id : 0;
            var userLoginId = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "";
            var ip          = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            if (userId <= 0) return Unauthorized();
            var r = _accountService.ChangePassword(userId, userLoginId, ip, req);
            return r.Success ? Ok(r) : BadRequest(r);
        }

        [HttpPost("change-mobile"), Authorize]
        public IActionResult ChangeMobile([FromBody] ChangeMobileRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.NewMobileNo)) return BadRequest(new AccountChangeResponse { Success=false, Message="Mobile number is required." });
            var userId      = long.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0", out var id) ? id : 0;
            var userLoginId = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "";
            var ip          = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            if (userId <= 0) return Unauthorized();
            var r = _accountService.ChangeMobileNo(userId, userLoginId, ip, req.NewMobileNo);
            return r.Success ? Ok(r) : BadRequest(r);
        }

        [HttpPost("change-email"), Authorize]
        public IActionResult ChangeEmail([FromBody] ChangeEmailRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.NewEmailId)) return BadRequest(new AccountChangeResponse { Success=false, Message="Email ID is required." });
            var userId      = long.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0", out var id) ? id : 0;
            var userLoginId = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "";
            var ip          = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            if (userId <= 0) return Unauthorized();
            var r = _accountService.ChangeEmailId(userId, userLoginId, ip, req.NewEmailId);
            return r.Success ? Ok(r) : BadRequest(r);
        }

        [HttpGet("security-question"), Authorize]
        public IActionResult GetSecurityQuestion()
        {
            var userId = long.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0", out var id) ? id : 0;
            if (userId <= 0) return Unauthorized();
            return Ok(_accountService.GetSecurityQuestionDetails(userId));
        }

        [HttpPost("change-security-question"), Authorize]
        public IActionResult ChangeSecurityQuestion([FromBody] ChangeSecurityQuestionRequest req)
        {
            if (req == null || req.SecurityQuestionID <= 0) return BadRequest(new AccountChangeResponse { Success=false, Message="Please select a security question." });
            var userId      = long.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0", out var id) ? id : 0;
            var userLoginId = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "";
            var ip          = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            if (userId <= 0) return Unauthorized();
            var r = _accountService.ChangeSecurityQuestion(userId, userLoginId, ip, req);
            return r.Success ? Ok(r) : BadRequest(r);
        }
    }
}
