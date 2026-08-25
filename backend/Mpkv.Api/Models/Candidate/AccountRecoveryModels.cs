namespace Mpkv.Api.Models.Candidate
{
    public class ForgotLoginIdRequest { public string CandidateName { get; set; } = string.Empty; public string MobileNo { get; set; } = string.Empty; }
    public class ForgotLoginIdVerifyOtpRequest { public string CandidateName { get; set; } = string.Empty; public string MobileNo { get; set; } = string.Empty; public string OTP { get; set; } = string.Empty; }
    public class ForgotLoginIdResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; public string? LoginID { get; set; } }
    public class ForgotPasswordMethodRequest { public int Method { get; set; } }
    public class ResetBySecurityQuestionRequest { public string UserLoginID { get; set; } = string.Empty; public short SecurityQuestionID { get; set; } public string SecurityQuestionAnswer { get; set; } = string.Empty; }
    public class ResetBySecurityQuestionResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; public string? ResetToken { get; set; } }
    public class CheckAndSendOtpMobileRequest { public string UserLoginID { get; set; } = string.Empty; public string MobileNo { get; set; } = string.Empty; }
    public class CheckAndSendOtpEmailRequest { public string UserLoginID { get; set; } = string.Empty; public string EMailID { get; set; } = string.Empty; }
    public class SendOtpResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; }
    public class VerifyOtpRequest { public string UserLoginID { get; set; } = string.Empty; public string OTP { get; set; } = string.Empty; public string Channel { get; set; } = string.Empty; public string Contact { get; set; } = string.Empty; }
    public class VerifyOtpResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; public string? ResetToken { get; set; } }
    public class ResetPasswordRequest { public string ResetToken { get; set; } = string.Empty; public string NewPassword { get; set; } = string.Empty; public string ConfirmPassword { get; set; } = string.Empty; }
    public class ResetPasswordResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; }
    public class AccountMastersResponse { public List<DropdownItem> SecurityQuestions { get; set; } = new(); }

    // ── Miscellaneous — Change Password / Mobile / Email / Security Question ──
    public class ChangePasswordRequest
    {
        public string OldPassword     { get; set; } = "";
        public string NewPassword     { get; set; } = "";
        public string ConfirmPassword { get; set; } = "";
    }
    public class ChangeMobileRequest   { public string NewMobileNo { get; set; } = ""; }
    public class ChangeEmailRequest    { public string NewEmailId  { get; set; } = ""; }
    public class ChangeSecurityQuestionRequest
    {
        public int    SecurityQuestionID     { get; set; }
        public string SecurityQuestionAnswer { get; set; } = "";
    }
    public class AccountChangeResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
    }
    public class SecurityQuestionDetailsResponse
    {
        public List<DropdownItem> SecurityQuestions             { get; set; } = new();
        public int                CurrentSecurityQuestionID     { get; set; }
        public string             CurrentSecurityQuestionAnswer { get; set; } = "";
    }
}
