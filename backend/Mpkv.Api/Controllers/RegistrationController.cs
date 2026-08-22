using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Models.Candidate;
using Mpkv.Api.Services;

namespace Mpkv.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RegistrationController : ControllerBase
    {
        private readonly IRegistrationService _registrationService;
        public RegistrationController(IRegistrationService registrationService) => _registrationService = registrationService;

        [HttpGet("check-status")] public IActionResult CheckStatus() => Ok(_registrationService.GetRegistrationStatus());
        [HttpGet("masters")]      public IActionResult GetMasters()  => Ok(_registrationService.GetMasters());

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.CandidateName) || string.IsNullOrWhiteSpace(request.MobileNo) || string.IsNullOrWhiteSpace(request.EMailID) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new RegisterResponse { Success = false, Message = "Please fill in all required fields." });
            var result = _registrationService.Register(request, HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("info")]
        public IActionResult GetInfo([FromQuery] string loginId)
        {
            if (string.IsNullOrWhiteSpace(loginId)) return BadRequest(new RegistrationInfoResponse { Found = false });
            var result = _registrationService.GetRegistrationInfo(loginId);
            return result.Found ? Ok(result) : NotFound(new RegistrationInfoResponse { Found = false });
        }
    }
}
