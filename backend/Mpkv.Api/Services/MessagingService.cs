using System.Net;
using System.Net.Mail;
using System.Text;
using System.Text.Json;

namespace Mpkv.Api.Services
{
    public interface IMessagingService
    {
        Task<bool> SendSmsAsync(string mobileNo, string message, string templateId = "");
        Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody, string purpose = "");
    }

    public class MessagingService : IMessagingService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<MessagingService> _logger;
        private const string Msg91ApiUrl = "https://api.msg91.com/api/v5/flow/";

        public MessagingService(IConfiguration config, ILogger<MessagingService> logger)
        { _config = config; _logger = logger; }

        public async Task<bool> SendSmsAsync(string mobileNo, string message, string templateId = "")
        {
            try
            {
                var authKey  = _config["Messaging:Msg91AuthKey"] ?? "";
                var senderId = _config["Messaging:Msg91SenderID"] ?? "MPKVRH";
                if (string.IsNullOrEmpty(authKey)) { _logger.LogWarning("MSG91 AuthKey not configured."); return false; }
                var payload = new { flow_id = templateId, sender = senderId, mobiles = "91" + mobileNo.Trim(), var1 = message };
                using var client = new HttpClient();
                client.DefaultRequestHeaders.Add("authkey", authKey);
                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await client.PostAsync(Msg91ApiUrl, content);
                _logger.LogInformation($"MSG91 SMS to {mobileNo}: {response.StatusCode}");
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex) { _logger.LogError($"SendSmsAsync error: {ex.Message}"); return false; }
        }

        public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody, string purpose = "")
        {
            return await Task.Run(() =>
            {
                try
                {
                    var smtpHost = _config["Messaging:Gmail:SmtpHost"] ?? "smtp.gmail.com";
                    var smtpPort = int.Parse(_config["Messaging:Gmail:SmtpPort"] ?? "587");
                    var fromName = _config["Messaging:Gmail:FromName"] ?? "MPKV, Rahuri";
                    string fromAddress, password;
                    if (purpose == "NewCandidateRegistration") { fromAddress = _config["Messaging:Gmail:RegistrationFrom"] ?? ""; password = _config["Messaging:Gmail:RegistrationPassword"] ?? ""; }
                    else if (purpose == "ResetPassword") { fromAddress = _config["Messaging:Gmail:ResetPasswordFrom"] ?? ""; password = _config["Messaging:Gmail:ResetPasswordPassword"] ?? ""; }
                    else { fromAddress = _config["Messaging:Gmail:OthersFrom"] ?? ""; password = _config["Messaging:Gmail:OthersPassword"] ?? ""; }
                    if (string.IsNullOrEmpty(fromAddress) || string.IsNullOrEmpty(password) || string.IsNullOrEmpty(toEmail)) return false;
                    using var smtpClient = new SmtpClient(smtpHost, smtpPort); smtpClient.EnableSsl = true; smtpClient.UseDefaultCredentials = false; smtpClient.Credentials = new NetworkCredential(fromAddress, password);
                    using var mail = new MailMessage(); mail.From = new MailAddress(fromAddress, fromName); mail.To.Add(toEmail); mail.Subject = subject; mail.Body = htmlBody; mail.IsBodyHtml = true;
                    smtpClient.Send(mail);
                    _logger.LogInformation($"Email sent to {toEmail} for purpose: {purpose}");
                    return true;
                }
                catch (Exception ex) { _logger.LogError($"SendEmailAsync error (purpose={purpose}): {ex.Message}"); return false; }
            });
        }
    }
}
