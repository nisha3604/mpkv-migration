using Microsoft.AspNetCore.Mvc;
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
    }
}
