using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.Candidate;

namespace Mpkv.Api.Services
{
    public interface IAccountRecoveryService
    {
        AccountMastersResponse          GetMasters();
        ForgotLoginIdResponse           SendForgotLoginIdOtp(ForgotLoginIdRequest request);
        ForgotLoginIdResponse           VerifyForgotLoginIdOtp(ForgotLoginIdVerifyOtpRequest request);
        ResetBySecurityQuestionResponse CheckBySecurityQuestion(ResetBySecurityQuestionRequest request);
        SendOtpResponse                 CheckAndSendOtpMobile(CheckAndSendOtpMobileRequest request);
        SendOtpResponse                 CheckAndSendOtpEmail(CheckAndSendOtpEmailRequest request);
        VerifyOtpResponse               VerifyOtp(VerifyOtpRequest request);
        ResetPasswordResponse           ResetPassword(ResetPasswordRequest request, string ipAddress);
    }

    public class AccountRecoveryService : IAccountRecoveryService
    {
        private readonly DbAccess          _db;
        private readonly IMessagingService _messaging;
        private readonly IConfiguration   _config;

        public AccountRecoveryService(DbAccess db, IMessagingService messaging, IConfiguration config)
        {
            _db        = db;
            _messaging = messaging;
            _config    = config;
        }

        public AccountMastersResponse GetMasters()
        {
            var response = new AccountMastersResponse();
            try
            {
                var param = new DynamicParameters();
                param.Add("@TableName",        "Master_SecurityQuestion");
                param.Add("@DataValueField",   "SecurityQuestionID");
                param.Add("@DataTextField",    "SecurityQuestion");
                param.Add("@ParentField",      "");
                param.Add("@ParentFieldValue", "");
                param.Add("@OrderByFields",    "SecurityQuestion");
                var dt = _db.GetDataTable("Base_GetMasterTableList", param);
                if (dt != null)
                    foreach (System.Data.DataRow row in dt.Rows)
                        response.SecurityQuestions.Add(new DropdownItem { Value = row[0].ToString()!, Text = row[1].ToString()! });
            }
            catch (Exception ex) { Console.WriteLine($"GetMasters error: {ex.Message}"); }
            return response;
        }

        public ForgotLoginIdResponse SendForgotLoginIdOtp(ForgotLoginIdRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.CandidateName) || string.IsNullOrWhiteSpace(request.MobileNo))
                    return new ForgotLoginIdResponse { Success = false, Message = "Please enter Candidate Name and Mobile Number." };
                if (!System.Text.RegularExpressions.Regex.IsMatch(request.MobileNo.Trim(), @"^\d{10}$"))
                    return new ForgotLoginIdResponse { Success = false, Message = "Please enter a valid 10-digit Mobile Number." };
                var idParam = new DynamicParameters();
                idParam.Add("@UserName", request.CandidateName.Trim().ToUpper());
                idParam.Add("@MobileNo", request.MobileNo.Trim());
                var loginId = _db.ExecuteScalar("Account_GetUserLoginID", idParam)?.ToString() ?? "";
                if (loginId.Length == 0)
                    return new ForgotLoginIdResponse { Success = false, Message = "No Record Found. Please check your Candidate Name and Mobile Number." };
                var otpVal   = GenerateOTP(4);
                var otpParam = new DynamicParameters();
                otpParam.Add("@MobileNo", request.MobileNo.Trim());
                otpParam.Add("@Purpose",  "ForgotLoginID");
                otpParam.Add("@OTP",      otpVal);
                var storedOtp = _db.ExecuteScalar("Base_GetOTP", otpParam)?.ToString() ?? otpVal;
                var smsParam  = new DynamicParameters();
                smsParam.Add("@Purpose", "ForgotLoginID"); smsParam.Add("@MessageType", "S");
                smsParam.Add("@Param1", ""); smsParam.Add("@Param2", ""); smsParam.Add("@Param3", "");
                smsParam.Add("@Param4", ""); smsParam.Add("@Param5", "");
                var smsDt      = _db.GetDataTable("Base_GetEMailSMS", smsParam);
                var templateId = smsDt?.Rows.Count > 0 ? smsDt.Rows[0]["TemplateID"].ToString() ?? "" : "";
                _ = _messaging.SendSmsAsync(request.MobileNo.Trim(), storedOtp, templateId);
                return new ForgotLoginIdResponse { Success = true, Message = $"OTP has been sent to Mobile No. {MaskMobile(request.MobileNo.Trim())}. Please enter OTP to get your Login ID." };
            }
            catch (Exception ex) { return new ForgotLoginIdResponse { Success = false, Message = ex.Message }; }
        }

        public ForgotLoginIdResponse VerifyForgotLoginIdOtp(ForgotLoginIdVerifyOtpRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.OTP))
                    return new ForgotLoginIdResponse { Success = false, Message = "Please enter the OTP." };
                var param = new DynamicParameters();
                param.Add("@MobileNo", request.MobileNo.Trim());
                param.Add("@Purpose",  "ForgotLoginID");
                param.Add("@OTP",      request.OTP.Trim());
                var result = _db.ExecuteScalar("Base_SaveOTPVerificationStatus", param)?.ToString() ?? "";
                if (result.ToUpper() != "Y")
                    return new ForgotLoginIdResponse { Success = false, Message = "Invalid OTP. Please try again." };
                var idParam = new DynamicParameters();
                idParam.Add("@UserName", request.CandidateName.Trim().ToUpper());
                idParam.Add("@MobileNo", request.MobileNo.Trim());
                var loginId = _db.ExecuteScalar("Account_GetUserLoginID", idParam)?.ToString() ?? "";
                return new ForgotLoginIdResponse { Success = true, Message = "OTP verified successfully.", LoginID = loginId };
            }
            catch (Exception ex) { return new ForgotLoginIdResponse { Success = false, Message = ex.Message }; }
        }

        public ResetBySecurityQuestionResponse CheckBySecurityQuestion(ResetBySecurityQuestionRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.UserLoginID)) return new ResetBySecurityQuestionResponse { Success = false, Message = "Please enter your Login ID." };
                if (request.SecurityQuestionID <= 0) return new ResetBySecurityQuestionResponse { Success = false, Message = "Please select a Security Question." };
                if (string.IsNullOrWhiteSpace(request.SecurityQuestionAnswer)) return new ResetBySecurityQuestionResponse { Success = false, Message = "Please enter your Security Question Answer." };
                var param = new DynamicParameters();
                param.Add("@UserLoginID",            request.UserLoginID.Trim().ToUpper());
                param.Add("@SecurityQuestionID",     request.SecurityQuestionID);
                param.Add("@SecurityQuestionAnswer", request.SecurityQuestionAnswer.Trim().ToUpper());
                var dt = _db.GetDataTable("Account_CheckForgotPassword", param);
                if (dt == null || dt.Rows.Count == 0) return new ResetBySecurityQuestionResponse { Success = false, Message = "No record found." };
                var loginId  = dt.Rows[0]["UserLoginID"].ToString() ?? "";
                var errorMsg = dt.Rows[0]["ErrorMessage"].ToString() ?? "";
                if (loginId.Length == 0) return new ResetBySecurityQuestionResponse { Success = false, Message = errorMsg.Length > 0 ? errorMsg : "Invalid Login ID, Security Question or Answer." };
                return new ResetBySecurityQuestionResponse { Success = true, Message = "Verification successful.", ResetToken = BuildResetToken(loginId) };
            }
            catch (Exception ex) { return new ResetBySecurityQuestionResponse { Success = false, Message = ex.Message }; }
        }

        public SendOtpResponse CheckAndSendOtpMobile(CheckAndSendOtpMobileRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.UserLoginID)) return new SendOtpResponse { Success = false, Message = "Please enter your Login ID." };
                if (!System.Text.RegularExpressions.Regex.IsMatch(request.MobileNo?.Trim() ?? "", @"^\d{10}$")) return new SendOtpResponse { Success = false, Message = "Please enter a valid 10-digit Mobile Number." };
                var checkParam = new DynamicParameters();
                checkParam.Add("@UserLoginID", request.UserLoginID.Trim().ToUpper());
                checkParam.Add("@EMailID",     "");
                checkParam.Add("@MobileNo",    request.MobileNo.Trim());
                var dt = _db.GetDataTable("Account_CheckForgotPasswordByOTP", checkParam);
                if (dt == null || dt.Rows.Count == 0) return new SendOtpResponse { Success = false, Message = "No record found." };
                var loginId  = dt.Rows[0]["UserLoginID"].ToString() ?? "";
                var errorMsg = dt.Rows[0]["ErrorMessage"].ToString() ?? "";
                if (loginId.Length == 0) return new SendOtpResponse { Success = false, Message = errorMsg.Length > 0 ? errorMsg : "Invalid Login ID or Mobile Number." };
                var otpVal   = GenerateOTP(4);
                var otpParam = new DynamicParameters();
                otpParam.Add("@MobileNo", request.MobileNo.Trim());
                otpParam.Add("@Purpose",  "ResetPassword");
                otpParam.Add("@OTP",      otpVal);
                var storedOtp = _db.ExecuteScalar("Base_GetOTP", otpParam)?.ToString() ?? otpVal;
                var smsParam  = new DynamicParameters();
                smsParam.Add("@Purpose", "ResetPassword"); smsParam.Add("@MessageType", "S");
                smsParam.Add("@Param1", ""); smsParam.Add("@Param2", ""); smsParam.Add("@Param3", ""); smsParam.Add("@Param4", ""); smsParam.Add("@Param5", "");
                var smsDt = _db.GetDataTable("Base_GetEMailSMS", smsParam);
                var templateId = smsDt?.Rows.Count > 0 ? smsDt.Rows[0]["TemplateID"].ToString() ?? "" : "";
                _ = _messaging.SendSmsAsync(request.MobileNo.Trim(), storedOtp, templateId);
                return new SendOtpResponse { Success = true, Message = $"OTP has been sent to Mobile No. {MaskMobile(request.MobileNo.Trim())}. Please check your SMS." };
            }
            catch (Exception ex) { return new SendOtpResponse { Success = false, Message = ex.Message }; }
        }

        public SendOtpResponse CheckAndSendOtpEmail(CheckAndSendOtpEmailRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.UserLoginID)) return new SendOtpResponse { Success = false, Message = "Please enter your Login ID." };
                if (string.IsNullOrWhiteSpace(request.EMailID)) return new SendOtpResponse { Success = false, Message = "Please enter your Email ID." };
                var checkParam = new DynamicParameters();
                checkParam.Add("@UserLoginID", request.UserLoginID.Trim().ToUpper());
                checkParam.Add("@EMailID",     request.EMailID.Trim().ToLower());
                checkParam.Add("@MobileNo",    "");
                var dt = _db.GetDataTable("Account_CheckForgotPasswordByOTP", checkParam);
                if (dt == null || dt.Rows.Count == 0) return new SendOtpResponse { Success = false, Message = "No record found." };
                var loginId  = dt.Rows[0]["UserLoginID"].ToString() ?? "";
                var errorMsg = dt.Rows[0]["ErrorMessage"].ToString() ?? "";
                if (loginId.Length == 0) return new SendOtpResponse { Success = false, Message = errorMsg.Length > 0 ? errorMsg : "Invalid Login ID or Email ID." };
                var otpVal   = GenerateOTP(4);
                var otpParam = new DynamicParameters();
                otpParam.Add("@MobileNo", request.EMailID.Trim().ToLower());
                otpParam.Add("@Purpose",  "ResetPassword");
                otpParam.Add("@OTP",      otpVal);
                var storedOtp = _db.ExecuteScalar("Base_GetOTP", otpParam)?.ToString() ?? otpVal;
                var emailParam = new DynamicParameters();
                emailParam.Add("@Purpose", "ResetPassword"); emailParam.Add("@MessageType", "E");
                emailParam.Add("@Param1", ""); emailParam.Add("@Param2", ""); emailParam.Add("@Param3", ""); emailParam.Add("@Param4", ""); emailParam.Add("@Param5", "");
                var emailDt = _db.GetDataTable("Base_GetEMailSMS", emailParam);
                string subject = emailDt?.Rows.Count > 0 ? emailDt.Rows[0]["Subject"].ToString() ?? "Reset Password OTP" : "Reset Password OTP";
                string msgBody = emailDt?.Rows.Count > 0 ? emailDt.Rows[0]["Message"].ToString() ?? "" : "";
                msgBody = msgBody.Contains("##OTP##") ? msgBody.Replace("##OTP##", storedOtp) : $"<p>Your OTP for Reset Password is: <strong>{storedOtp}</strong></p>";
                _ = _messaging.SendEmailAsync(request.EMailID.Trim(), subject, msgBody, "ResetPassword");
                return new SendOtpResponse { Success = true, Message = $"OTP has been sent to E-Mail ID {MaskEmail(request.EMailID.Trim())}. Please check your inbox." };
            }
            catch (Exception ex) { return new SendOtpResponse { Success = false, Message = ex.Message }; }
        }

        public VerifyOtpResponse VerifyOtp(VerifyOtpRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.OTP)) return new VerifyOtpResponse { Success = false, Message = "Please enter the OTP." };
                var param = new DynamicParameters();
                param.Add("@MobileNo", request.Contact.Trim());
                param.Add("@Purpose",  "ResetPassword");
                param.Add("@OTP",      request.OTP.Trim());
                var result = _db.ExecuteScalar("Base_SaveOTPVerificationStatus", param)?.ToString() ?? "";
                if (result.ToUpper() != "Y") return new VerifyOtpResponse { Success = false, Message = "Invalid OTP. Please try again." };
                return new VerifyOtpResponse { Success = true, Message = "OTP verified successfully.", ResetToken = BuildResetToken(request.UserLoginID) };
            }
            catch (Exception ex) { return new VerifyOtpResponse { Success = false, Message = ex.Message }; }
        }

        public ResetPasswordResponse ResetPassword(ResetPasswordRequest request, string ipAddress)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.ResetToken)) return new ResetPasswordResponse { Success = false, Message = "Invalid or missing reset token." };
                if (string.IsNullOrWhiteSpace(request.NewPassword)) return new ResetPasswordResponse { Success = false, Message = "Please enter a new password." };
                if (request.NewPassword != request.ConfirmPassword) return new ResetPasswordResponse { Success = false, Message = "New Password and Confirm New Password should be same." };
                var loginId = ValidateResetToken(request.ResetToken);
                if (string.IsNullOrEmpty(loginId)) return new ResetPasswordResponse { Success = false, Message = "Invalid or expired reset link." };
                var idParam = new DynamicParameters();
                idParam.Add("@UserLoginID", loginId);
                var userIdObj = _db.ExecuteScalar("Account_GetUserID", idParam);
                if (userIdObj == null) return new ResetPasswordResponse { Success = false, Message = "User not found." };
                long userId = Convert.ToInt64(userIdObj);
                string encodedPassword = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(request.NewPassword));
                var resetParam = new DynamicParameters();
                resetParam.Add("@UserID",              userId);
                resetParam.Add("@NewPassword",         encodedPassword);
                resetParam.Add("@LoggedInUserLoginID", "");
                resetParam.Add("@IPAddress",           ipAddress);
                var result = _db.ExecuteScalar("Account_ResetPassword", resetParam)?.ToString() ?? "";
                if (result.ToUpper() == "Y") return new ResetPasswordResponse { Success = true, Message = "Password changed successfully." };
                return new ResetPasswordResponse { Success = false, Message = result.Length > 0 ? result : "Password has not reset. Please try again." };
            }
            catch (Exception ex) { return new ResetPasswordResponse { Success = false, Message = ex.Message }; }
        }

        private static string BuildResetToken(string loginId)
        {
            var raw = $"{loginId}|{loginId.GetHashCode()}";
            return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(raw));
        }
        private static string ValidateResetToken(string token)
        {
            try { var raw = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(token)); var parts = raw.Split('|'); if (parts.Length != 2) return ""; return parts[0].GetHashCode().ToString() == parts[1] ? parts[0] : ""; }
            catch { return ""; }
        }
        private static string GenerateOTP(int length) { var rng = new Random(); return string.Concat(Enumerable.Range(0, length).Select(_ => rng.Next(0, 10).ToString())); }
        private static string MaskMobile(string mobile) => mobile.Length >= 10 ? "XXXXXX" + mobile[^4..] : mobile;
        private static string MaskEmail(string email) { var idx = email.IndexOf('@'); if (idx <= 1) return email; return email[0] + new string('*', Math.Min(idx - 1, 2)) + email[idx..]; }
    }
}
