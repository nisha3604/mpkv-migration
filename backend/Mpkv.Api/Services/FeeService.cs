using Mpkv.Api.Data;
using Mpkv.Api.Models.Candidate;
using Dapper;

namespace Mpkv.Api.Services
{
    public interface IFeeService
    {
        Task CheckFailedTransactions(long candidateId);
        Task<(bool IsPaid, string RedirectUrl)> ProcessNsdlResponse(string msg, string frontendBase);
        Task<string> ProcessNsdlPushResponse(string msg);
        Task<(bool IsPaid, string RedirectUrl)> ProcessBillDeskResponse(string transactionResponse, string frontendBase);
        FeeResponseEntity SetFeeTransactionResponse(FeeTransactionEntity ft);
        FeeTransactionEntity? GetTransactionDetails(long transactionId);
        FeeProceedResponse SaveApplicationFeeDetails(long candidateId, string userLoginId, string ipAddress);
        PaymentHistoryResponse GetTransactionHistory(long candidateId);
    }

    public class FeeService : IFeeService
    {
        private readonly DbAccess _db;
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;

        public FeeService(DbAccess db, IConfiguration config, IHttpClientFactory httpClientFactory)
        { _db = db; _config = config; _httpClientFactory = httpClientFactory; }

        public FeeTransactionEntity? GetTransactionDetails(long transactionId)
        {
            try { var p = new DynamicParameters(); p.Add("@TransactionID", transactionId); var dt = _db.GetDataTable("Fee_GetTransactionDetails", p); if (dt == null || dt.Rows.Count == 0) return null; var row = dt.Rows[0]; bool H(string n) => dt.Columns.Contains(n); return new FeeTransactionEntity { TransactionID = transactionId, PayeeID = H("PayeeID") && row["PayeeID"] != DBNull.Value ? Convert.ToInt64(row["PayeeID"]) : 0, PayeeApplicationID = H("PayeeApplicationID") ? row["PayeeApplicationID"]?.ToString() ?? "" : "", PayeeName = H("PayeeName") ? row["PayeeName"]?.ToString() ?? "" : "", PayeeMobileNo = H("PayeeMobileNo") ? row["PayeeMobileNo"]?.ToString() ?? "" : "", PayeeEMailID = H("PayeeEMailID") ? row["PayeeEMailID"]?.ToString() ?? "" : "", FeeAmount = H("FeeAmount") && row["FeeAmount"] != DBNull.Value ? Convert.ToDecimal(row["FeeAmount"]) : 0, PhaseID = H("PhaseID") && row["PhaseID"] != DBNull.Value ? Convert.ToInt32(row["PhaseID"]) : 0, AppliedCourse = H("AppliedCourse") ? row["AppliedCourse"]?.ToString() ?? "" : "", Purpose = H("Purpose") ? row["Purpose"]?.ToString() ?? "" : "", IsPaid = H("IsPaid") && row["IsPaid"] != DBNull.Value && Convert.ToBoolean(row["IsPaid"]) }; }
            catch (Exception ex) { Console.WriteLine($"[GetTransactionDetails] error: {ex.Message}"); return null; }
        }

        public FeeResponseEntity SetFeeTransactionResponse(FeeTransactionEntity ft)
        {
            var response = new FeeResponseEntity();
            try { var p = new DynamicParameters(); p.Add("@TransactionID", ft.TransactionID); p.Add("@FeeAmount", ft.FeeAmount); p.Add("@IsPaid", ft.IsPaid); p.Add("@BankReferenceNo", ft.BankRefereneceNo); p.Add("@PayGateID", ft.PayGateID); p.Add("@TransactionResponse", ft.TransactionResponse); p.Add("@PaymentGatewayResponse", ft.PaymentGatewayResponse); p.Add("@Optional1", ft.Optional1); p.Add("@Optional2", ft.Optional2); p.Add("@Optional3", ft.Optional3); p.Add("@Optional4", ft.Optional4); p.Add("@Optional5", ft.Optional5); p.Add("@UserLoginId", ft.UserLoginId); p.Add("@IPAddress", ft.IPAddress); var dt = _db.GetDataTable("Fee_SetFeeTransactionResponse", p); if (dt != null && dt.Rows.Count > 0) { var row = dt.Rows[0]; bool H(string n) => dt.Columns.Contains(n); response.TransactionID = H("TransactionID") && row["TransactionID"] != DBNull.Value ? Convert.ToInt64(row["TransactionID"]) : 0; response.FeeAmount = H("FeeAmount") && row["FeeAmount"] != DBNull.Value ? Convert.ToInt32(row["FeeAmount"]) : 0; response.BankReferenceNo = H("BankReferenceNo") ? row["BankReferenceNo"]?.ToString() ?? "" : ""; response.SuccessFlag = H("SuccessFlag") ? row["SuccessFlag"]?.ToString() ?? "" : ""; response.ErrorMessage = H("ErrorMessage") ? row["ErrorMessage"]?.ToString() ?? "" : ""; response.IsPaid = ft.IsPaid; } }
            catch (Exception ex) { Console.WriteLine($"[SetFeeTransactionResponse] error: {ex.Message}"); response.SuccessFlag = "N"; response.ErrorMessage = ex.Message; }
            return response;
        }

        public FeeProceedResponse SaveApplicationFeeDetails(long candidateId, string userLoginId, string ipAddress)
        {
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","PayApplicationFee"); var result = _db.ExecuteScalar("ApplicationForm_SaveApplicationFeeDetails", p)?.ToString() ?? ""; if (result.ToUpper() == "Y") return new FeeProceedResponse { Success = true, Message = "Fee details saved." }; return new FeeProceedResponse { Success = false, Message = result.Length > 0 ? result : "Failed to save fee details." }; }
            catch (Exception ex) { return new FeeProceedResponse { Success = false, Message = ex.Message }; }
        }

        public async Task CheckFailedTransactions(long candidateId)
        {
            try { var p = new DynamicParameters(); p.Add("@PayeeID", candidateId); var dt = _db.GetDataTable("Fee_GetFailedTransactionForAPICheck", p); if (dt == null || dt.Rows.Count == 0) return; var merchantId = _config["NSDL:MerchantID"] ?? ""; var secretKey = _config["NSDL:SecretKey"] ?? ""; var apiUrl = _config["NSDL:PaidCheckAPIURL"] ?? ""; var userName = _config["NSDL:UserName"] ?? ""; var password = _config["NSDL:Password"] ?? ""; if (string.IsNullOrEmpty(merchantId) || string.IsNullOrEmpty(apiUrl)) return; foreach (System.Data.DataRow row in dt.Rows) { if (row["TransactionID"] == DBNull.Value) continue; var txId = Convert.ToInt64(row["TransactionID"]); try { await CheckSingleNsdlTransaction(txId, merchantId, secretKey, apiUrl, userName, password); } catch { } } } catch { }
        }

        private async Task CheckSingleNsdlTransaction(long txId, string merchantId, string secretKey, string apiUrl, string userName, string password)
        {
            var msg = $"|{merchantId}|{txId}"; var client = _httpClientFactory.CreateClient(); var credentials = Convert.ToBase64String(System.Text.Encoding.ASCII.GetBytes($"{userName}:{password}")); client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", credentials); var content = new FormUrlEncodedContent(new[] { new KeyValuePair<string, string>("requestMsg", msg) }); var httpResp = await client.PostAsync($"{apiUrl.TrimEnd('/')}/queryPaymentStatus", content); var responseStr = await httpResp.Content.ReadAsStringAsync(); if (!responseStr.StartsWith("S")) return; var parts = responseStr.Split('|'); if (parts.Length < 20) return; var checksum = parts[parts.Length - 1]; var msgWithKey = responseStr.Substring(0, responseStr.LastIndexOf('|')) + "|" + secretKey; var computed = ComputeCrc32(msgWithKey).ToString(); if (computed != checksum) return; var ft = new FeeTransactionEntity { TransactionID = Convert.ToInt64(parts[4]), FeeAmount = parts.Length > 6 ? decimal.TryParse(parts[6], out var fa) ? fa : 0 : 0, Optional2 = parts.Length > 8 ? parts[8] : "", PayGateID = parts.Length > 10 ? parts[10] : "", BankRefereneceNo = parts.Length > 11 ? parts[11] : "", ErrorMessage = parts.Length > 12 ? parts[12] : "", Optional4 = parts.Length > 18 ? parts[18] : "", Optional5 = parts.Length > 19 ? parts[19] : "", IsPaid = parts[0] == "S", IsValid = parts[0] == "S", PaymentGatewayResponse = responseStr }; SetFeeTransactionResponse(ft);
        }

        public async Task<(bool IsPaid, string RedirectUrl)> ProcessNsdlResponse(string msg, string frontendBase)
        {
            try { if (string.IsNullOrWhiteSpace(msg)) return (false, $"{frontendBase}/payment-failed?msg=Empty+response+received"); var secretKey = _config["NSDL:SecretKey"] ?? ""; var parts = msg.Split('|'); if (parts.Length < 5) return (false, $"{frontendBase}/payment-failed?msg=Invalid+response+format"); var checksum = parts[parts.Length - 1]; var msgWithKey = msg.Substring(0, msg.LastIndexOf('|')) + "|" + secretKey; var computed = ComputeCrc32(msgWithKey).ToString(); if (!string.IsNullOrEmpty(secretKey) && computed != checksum) return (false, $"{frontendBase}/payment-failed?msg=Checksum+mismatch"); var responseFlag = parts[0]; var ft = new FeeTransactionEntity { PaymentGatewayResponse = msg }; if (responseFlag == "S") { ft.TransactionID = long.TryParse(parts.Length > 4 ? parts[4] : "0", out var tid) ? tid : 0; ft.FeeAmount = parts.Length > 6 ? decimal.TryParse(parts[6], out var fa) ? fa : 0 : 0; ft.Optional2 = parts.Length > 8 ? parts[8] : ""; ft.PayGateID = parts.Length > 10 ? parts[10] : ""; ft.BankRefereneceNo = parts.Length > 11 ? parts[11] : ""; ft.ErrorMessage = parts.Length > 12 ? parts[12] : ""; ft.Optional4 = parts.Length > 18 ? parts[18] : ""; ft.Optional5 = parts.Length > 19 ? parts[19] : ""; ft.IsPaid = true; ft.IsValid = true; } else if (responseFlag == "F" || responseFlag == "D") { ft.TransactionID = long.TryParse(parts.Length > 4 ? parts[4] : "0", out var tid2) ? tid2 : 0; ft.ErrorMessage = parts.Length > 12 ? parts[12] : "Payment failed."; ft.IsPaid = false; ft.IsValid = false; } else return (false, $"{frontendBase}/payment-failed?msg=Unknown+response+flag"); var fbResult = SetFeeTransactionResponse(ft); if (fbResult.SuccessFlag?.ToUpper() == "Y" && ft.IsPaid) { var txDetails = GetTransactionDetails(ft.TransactionID); if (txDetails?.PhaseID == 99) SaveApplicationFeeDetails(txDetails.PayeeID, "", ""); return (true, $"{frontendBase}/payment-success?txId={ft.TransactionID}&refNo={Uri.EscapeDataString(ft.BankRefereneceNo)}&amount={ft.FeeAmount}"); } else { return (false, $"{frontendBase}/payment-failed?msg={Uri.EscapeDataString(ft.ErrorMessage.Length > 0 ? ft.ErrorMessage : "Payment was not successful.")}"); } }
            catch (Exception ex) { return (false, $"{frontendBase}/payment-failed?msg={Uri.EscapeDataString(ex.Message)}"); }
        }

        public async Task<string> ProcessNsdlPushResponse(string msg)
        {
            try { if (string.IsNullOrWhiteSpace(msg)) return "400|N"; var secretKey = _config["NSDL:SecretKey"] ?? ""; var parts = msg.Split('|'); if (parts.Length < 5) return "400|N"; var checksum = parts[parts.Length - 1]; var msgWithKey = msg.Substring(0, msg.LastIndexOf('|')) + "|" + secretKey; var computed = ComputeCrc32(msgWithKey).ToString(); if (!string.IsNullOrEmpty(secretKey) && computed != checksum) return "400|N"; var responseFlag = parts[0]; var ft = new FeeTransactionEntity { IsPushResponse = true, PaymentGatewayResponse = msg }; if (responseFlag == "S") { ft.TransactionID = long.TryParse(parts.Length > 4 ? parts[4] : "0", out var tid) ? tid : 0; ft.FeeAmount = parts.Length > 6 ? decimal.TryParse(parts[6], out var fa) ? fa : 0 : 0; ft.Optional2 = parts.Length > 8 ? parts[8] : ""; ft.PayGateID = parts.Length > 10 ? parts[10] : ""; ft.BankRefereneceNo = parts.Length > 11 ? parts[11] : ""; ft.ErrorMessage = parts.Length > 12 ? parts[12] : ""; ft.Optional4 = parts.Length > 18 ? parts[18] : ""; ft.Optional5 = parts.Length > 19 ? parts[19] : ""; ft.IsPaid = true; ft.IsValid = true; } else { ft.TransactionID = long.TryParse(parts.Length > 4 ? parts[4] : "0", out var tid2) ? tid2 : 0; ft.IsPaid = false; } var pp = new DynamicParameters(); pp.Add("@TransactionID", ft.TransactionID); pp.Add("@BankRefereneceNo", ft.BankRefereneceNo); pp.Add("@PayGateID", ft.PayGateID); pp.Add("@GatewayFullResponse", ft.PaymentGatewayResponse); pp.Add("@TransactionResponse", ft.ErrorMessage); pp.Add("@FeeAmount", ft.FeeAmount); pp.Add("@IsPaid", ft.IsPaid); pp.Add("@Optional1", ft.Optional1); pp.Add("@Optional2", ft.Optional2); pp.Add("@Optional3", ft.Optional3); pp.Add("@Optional4", ft.Optional4); pp.Add("@Optional5", ft.Optional5); var result = _db.ExecuteScalar("Fee_SetFeePushResponse", pp)?.ToString() ?? "400|N"; return result; }
            catch (Exception ex) { Console.WriteLine($"[ProcessNsdlPushResponse] error: {ex.Message}"); return "400|N"; }
        }

        public async Task<(bool IsPaid, string RedirectUrl)> ProcessBillDeskResponse(string transactionResponse, string frontendBase)
        {
            try { if (string.IsNullOrWhiteSpace(transactionResponse)) return (false, $"{frontendBase}/payment-failed?msg=Empty+BillDesk+response"); string jsonPayload; var jwtParts = transactionResponse.Split('.'); if (jwtParts.Length >= 2) { var padded = jwtParts[1].PadRight(jwtParts[1].Length + (4 - jwtParts[1].Length % 4) % 4, '='); jsonPayload = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(padded)); } else jsonPayload = transactionResponse; var txn = System.Text.Json.JsonSerializer.Deserialize<BillDeskTransactionResponse>(jsonPayload, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }); if (txn == null) return (false, $"{frontendBase}/payment-failed?msg=Invalid+BillDesk+response"); var ft = new FeeTransactionEntity { PaymentGatewayResponse = transactionResponse }; if (long.TryParse(txn.orderid, out var oid)) ft.TransactionID = oid; if (decimal.TryParse(txn.amount, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var amt)) ft.FeeAmount = amt; ft.Optional2 = txn.payment_method_type; ft.BankRefereneceNo = txn.transactionid; ft.ErrorMessage = txn.transaction_error_desc; ft.Optional4 = txn.transaction_error_desc; ft.TransactionResponse = txn.transaction_error_desc; ft.Optional5 = txn.transaction_error_code; ft.IsPaid = txn.transaction_error_type?.ToLower() == "success"; ft.IsValid = ft.IsPaid; var fbResult = SetFeeTransactionResponse(ft); if (fbResult.SuccessFlag?.ToUpper() == "Y" && ft.IsPaid) { var txDetails = GetTransactionDetails(ft.TransactionID); if (txDetails?.PhaseID == 99) SaveApplicationFeeDetails(txDetails.PayeeID, "", ""); return (true, $"{frontendBase}/payment-success?txId={ft.TransactionID}&refNo={Uri.EscapeDataString(ft.BankRefereneceNo)}&amount={ft.FeeAmount}"); } else { return (false, $"{frontendBase}/payment-failed?msg={Uri.EscapeDataString(ft.ErrorMessage.Length > 0 ? ft.ErrorMessage : "Payment was not successful.")}"); } }
            catch (Exception ex) { return (false, $"{frontendBase}/payment-failed?msg={Uri.EscapeDataString(ex.Message)}"); }
        }

        private static uint ComputeCrc32(string input) { var bytes = System.Text.Encoding.UTF8.GetBytes(input); uint crc = 0xFFFFFFFF; uint poly = 0xEDB88320; foreach (var b in bytes) { crc ^= b; for (int i = 0; i < 8; i++) crc = (crc & 1) != 0 ? (crc >> 1) ^ poly : crc >> 1; } return crc ^ 0xFFFFFFFF; }

        // ══════════════════════════════════════════════════════════════════════
        // GET TRANSACTION HISTORY
        // GET /api/fee/transaction-history
        // Mirrors: PaymentHistory.aspx → FeeWorker().GetTransactionHistory(CandidateID)
        // SP: Fee_GetTransactionHistory @PayeeID
        // ══════════════════════════════════════════════════════════════════════
        public PaymentHistoryResponse GetTransactionHistory(long candidateId)
        {
            var r = new PaymentHistoryResponse();
            try
            {
                var p = new Dapper.DynamicParameters();
                p.Add("@PayeeID", candidateId);
                var dt = _db.GetDataTable("Fee_GetTransactionHistory", p);
                if (dt == null) return r;

                bool HC(string n) => dt.Columns.Contains(n);

                foreach (System.Data.DataRow row in dt.Rows)
                {
                    var t = new PaymentTransactionDto
                    {
                        TransactionID       = HC("TransactionID")   ? row["TransactionID"]?.ToString()   ?? "" : "",
                        Purpose             = HC("Purpose")         ? row["Purpose"]?.ToString()         ?? "" : "",
                        FeeAmount           = HC("FeeAmount")       ? row["FeeAmount"]?.ToString()       ?? "" : "",
                        ServiceCharge       = HC("ServiceCharge")   ? row["ServiceCharge"]?.ToString()   ?? "" : "",
                        TotalAmount         = HC("TotalAmount")     ? row["TotalAmount"]?.ToString()     ?? "" : "",
                        PaymentGateway      = HC("PaymentGateway")  ? row["PaymentGateway"]?.ToString()  ?? "" : "",
                        TransactionDate     = HC("TransactionDate") ? row["TransactionDate"]?.ToString() ?? "" : "",
                        PaymentDate         = HC("PaymentDate")     ? row["PaymentDate"]?.ToString()     ?? "" : "",
                        BankReferenceNo     = HC("BankReferenceNo") ? row["BankReferenceNo"]?.ToString() ?? "" : "",
                        TransactionResponse = HC("TransactionResponse") ? row["TransactionResponse"]?.ToString() ?? "" : "",
                        TransactionStatus   = HC("TransactionStatus")   ? row["TransactionStatus"]?.ToString()   ?? "" : "",
                        IsPaid              = HC("IsPaid") && row["IsPaid"] != System.DBNull.Value && Convert.ToBoolean(row["IsPaid"]),
                        ApplicationID       = HC("PayeeApplicationID") ? row["PayeeApplicationID"]?.ToString() ?? "" : "",
                        CandidateName       = HC("PayeeName")          ? row["PayeeName"]?.ToString()          ?? "" : "",
                        AppliedCourse       = HC("AppliedCourse")      ? row["AppliedCourse"]?.ToString()      ?? "" : "",
                    };
                    if (t.IsPaid) r.PaidTransactions.Add(t);
                    else          r.FailedTransactions.Add(t);
                }
            }
            catch (Exception ex) { Console.WriteLine($"[GetTransactionHistory] Error: {ex.Message}"); }
            return r;
        }
    }
}
