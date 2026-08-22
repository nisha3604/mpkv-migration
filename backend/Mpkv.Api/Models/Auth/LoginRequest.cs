namespace Mpkv.Api.Models.Auth
{
    public class LoginRequest
    {
        public string UserLoginID  { get; set; } = string.Empty;
        public string UserPassword { get; set; } = string.Empty;
    }
}
