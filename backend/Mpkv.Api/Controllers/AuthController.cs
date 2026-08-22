using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.Auth;
using Mpkv.Api.Services;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    /// <summary>
    /// Unified auth controller — handles ALL user types with one login endpoint.
    /// Candidate (91) → /candidate/dashboard
    /// College   (61) → /college/dashboard
    /// Admin  (11/12) → /admin/dashboard
    /// </summary>
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        public AuthController(IAuthService authService) => _authService = authService;

        private string GetIpAddress() => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.UserLoginID) || string.IsNullOrWhiteSpace(request?.UserPassword))
                return BadRequest(new LoginResponse { Success = false, Message = "Login ID and password are required." });
            var result = _authService.Login(request, GetIpAddress());
            return result.Success ? Ok(result) : Unauthorized(result);
        }

        [HttpGet("me")]
        [Authorize]
        public IActionResult Me()
        {
            var user = _authService.GetMe(User);
            return user != null ? Ok(user) : Unauthorized();
        }
    }
}
