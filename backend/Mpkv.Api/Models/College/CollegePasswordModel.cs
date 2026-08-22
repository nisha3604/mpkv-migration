namespace Mpkv.Api.Models.College
{
    // ══════════════════════════════════════════════════════════════════════════
    // College Password pages — admin only
    // GetCollegePassword.aspx + ResetCollegePassword.aspx
    // ══════════════════════════════════════════════════════════════════════════

    public class CollegePasswordItem
    {
        public string CollegeCode  { get; set; } = string.Empty;
        public string CollegeName  { get; set; } = string.Empty;
        public string District     { get; set; } = string.Empty;
        public string MobileNo     { get; set; } = string.Empty;
        /// <summary>Base64-decoded plaintext password — admin only.</summary>
        public string Password     { get; set; } = string.Empty;
    }

    public class CollegePasswordListResponse
    {
        public bool                     Success   { get; set; }
        public string                   Message   { get; set; } = string.Empty;
        public List<CollegePasswordItem> Colleges  { get; set; } = new();
    }

    public class SendPasswordSmsRequest
    {
        public string CollegeCode { get; set; } = string.Empty;
    }

    public class SendPasswordSmsResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class CurrentPasswordResponse
    {
        public bool   Success         { get; set; }
        public string Message         { get; set; } = string.Empty;
        public string CurrentPassword { get; set; } = string.Empty;
    }

    public class ResetCollegePasswordRequest
    {
        public string CollegeCode      { get; set; } = string.Empty;
        public string NewPassword      { get; set; } = string.Empty;
        public string ConfirmPassword  { get; set; } = string.Empty;
    }

    public class ResetCollegePasswordResponse
    {
        public bool   Success          { get; set; }
        public string Message          { get; set; } = string.Empty;
        public string UpdatedPassword  { get; set; } = string.Empty;
    }
}
