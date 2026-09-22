using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Mpkv.Api.Models.Candidate;
using Mpkv.Api.Services;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    [ApiController]
    [Route("api/fee")]
    public class FeeController : ControllerBase
    {
        private readonly IFeeService    _feeService;
        private readonly IConfiguration _config;
        public FeeController(IFeeService feeService, IConfiguration config) { _feeService = feeService; _config = config; }

        private string FrontendBase => _config["AllowedOrigins"]?.TrimEnd('/') ?? "http://localhost:5174";

        [HttpPost("nsdl-response")]    public async Task<IActionResult> NsdlResponse([FromForm] string? msg) { var (_, redirectUrl) = await _feeService.ProcessNsdlResponse(msg ?? "", FrontendBase); return Redirect(redirectUrl); }
        [HttpPost("nsdl-push")]        public async Task<IActionResult> NsdlPush([FromForm] string? msg) { var result = await _feeService.ProcessNsdlPushResponse(msg ?? ""); return Content(result, "text/plain"); }
        [HttpPost("billdesk-response")] public async Task<IActionResult> BillDeskResponse([FromForm] string? transaction_response) { var (_, redirectUrl) = await _feeService.ProcessBillDeskResponse(transaction_response ?? "", FrontendBase); return Redirect(redirectUrl); }

        [HttpGet("payment-success")]
        public IActionResult PaymentSuccess([FromQuery] long txId, [FromQuery] string? refNo, [FromQuery] decimal amount)
        {
            if (txId <= 0) return BadRequest(new PaymentSuccessInfo { Success = false, Message = "Invalid transaction." });
            var txDetails = _feeService.GetTransactionDetails(txId);
            if (txDetails == null) return NotFound(new PaymentSuccessInfo { Success = false, Message = "Transaction not found." });
            return Ok(new PaymentSuccessInfo { Success = true, Message = "Payment successful.", TransactionID = txId, BankReferenceNo = refNo ?? txDetails.BankRefereneceNo, FeeAmount = amount > 0 ? amount.ToString("F2") : txDetails.FeeAmount.ToString("F2"), RedirectUrl = "/candidate/summary" });
        }

        [HttpGet("payment-failed")]
        public IActionResult PaymentFailed([FromQuery] string? msg)
            => Ok(new PaymentFailedInfo { Success = false, Message = "Payment failed or was cancelled.", FailedMessage = msg ?? "Your payment could not be processed. Please try again.", RedirectUrl = "/candidate/fee" });

        // GET /api/fee/transaction-history — mirrors PaymentHistory.aspx (candidate self-service)
        [HttpGet("transaction-history"), Authorize]
        public IActionResult GetTransactionHistory()
        {
            var candidateId = long.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0", out var id) ? id : 0;
            if (candidateId <= 0) return Unauthorized();
            return Ok(_feeService.GetTransactionHistory(candidateId));
        }

        // GET /api/fee/admin-transaction-history/{appId} — admin override
        // Mirrors PaymentHistory.aspx?P1={CandidateID}&P2={hash} (admin flow)
        [HttpGet("admin-transaction-history/{appId}"), Authorize]
        public IActionResult GetAdminTransactionHistory(string appId, [FromServices] ICandidateUtilsService candidateUtilsSvc)
        {
            var userTypeId = int.TryParse(User.FindFirstValue("UserTypeID") ?? "0", out var ut) ? ut : 0;
            if (!Mpkv.Api.Helpers.UserTypeHelper.IsAdmin(userTypeId)) return Forbid();
            var info = candidateUtilsSvc.GetPasswordInfo(appId);
            if (!info.Success || info.CandidateID == 0)
                return Ok(new { success = false, message = "Invalid Application ID." });
            return Ok(_feeService.GetTransactionHistory(info.CandidateID));
        }

        // GET /api/fee/receipt/{transactionId}
        [HttpGet("receipt/{transactionId}"), Authorize]
        public IActionResult GetReceipt(long transactionId)
        {
            if (transactionId <= 0) return BadRequest(new { message = "Invalid transaction ID." });
            var tx = _feeService.GetTransactionDetails(transactionId);
            if (tx == null || tx.TransactionID <= 0)
                return NotFound(new { message = "Transaction not found." });
            return Ok(tx);
        }

        // ── Admin Fee / Refund Tools (UserTypeID 11 only) ─────────────────────

        private bool IsAdmin() => int.TryParse(User.FindFirstValue("UserTypeID") ?? "0", out var ut) && Mpkv.Api.Helpers.UserTypeHelper.IsAdmin(ut);
        private string GetLoginId() => User.FindFirstValue(ClaimTypes.Name) ?? "";
        private string GetIp() => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        // GET /api/fee/admin/failed-transactions/dates
        [HttpGet("admin/failed-transactions/dates"), Authorize]
        public IActionResult GetFailedTransactionDates()
        {
            if (!IsAdmin()) return Forbid();
            return Ok(new { success = true, items = _feeService.GetFailedTransactionsDateList() });
        }

        // POST /api/fee/admin/failed-transactions/check
        [HttpPost("admin/failed-transactions/check"), Authorize]
        public async Task<IActionResult> CheckFailedTransactions([FromBody] CheckFailedRequest req)
        {
            if (!IsAdmin()) return Forbid();
            var count = await _feeService.CheckFailedTransactionsByDate(req?.TransactionDate ?? "");
            return Ok(new { success = true, message = $"Checked {count} failed transactions.", count });
        }

        // GET /api/fee/admin/duplicate-transactions
        [HttpGet("admin/duplicate-transactions"), Authorize]
        public IActionResult GetDuplicateTransactions()
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_feeService.GetDuplicateTransactionsList());
        }

        // GET /api/fee/admin/transactions-for-refund/{inputValue}
        [HttpGet("admin/transactions-for-refund/{inputValue}"), Authorize]
        public IActionResult GetTransactionsForRefund(string inputValue)
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_feeService.GetTransactionsForRefund(inputValue));
        }

        // POST /api/fee/admin/initiate-refund
        [HttpPost("admin/initiate-refund"), Authorize]
        public IActionResult InitiateRefund([FromBody] InitiateRefundRequest req)
        {
            if (!IsAdmin()) return Forbid();
            if (req == null) return BadRequest(new { success = false, message = "Invalid request." });
            return Ok(_feeService.InitiateRefund(req.TransactionID, req.RefundRequestID ?? "", req.RefundPayGateID ?? "", req.RefundBankRRN ?? "", req.RefundInitiatedDateTime ?? "", GetLoginId(), GetIp()));
        }

        // POST /api/fee/admin/accept-chargeback
        [HttpPost("admin/accept-chargeback"), Authorize]
        public IActionResult AcceptChargeBack([FromBody] AcceptChargeBackRequest req)
        {
            if (!IsAdmin()) return Forbid();
            if (req == null) return BadRequest(new { success = false, message = "Invalid request." });
            return Ok(_feeService.AcceptChargeBack(req.TransactionID, GetLoginId(), GetIp()));
        }

        // GET /api/fee/admin/refunded-transactions
        [HttpGet("admin/refunded-transactions"), Authorize]
        public IActionResult GetRefundedTransactions()
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_feeService.GetRefundedTransactionsList());
        }

        // POST /api/fee/admin/check-refund-status
        [HttpPost("admin/check-refund-status"), Authorize]
        public async Task<IActionResult> CheckRefundStatus()
        {
            if (!IsAdmin()) return Forbid();
            return Ok(await _feeService.CheckAndUpdateRefundStatuses(GetLoginId(), GetIp()));
        }
    }

    public class CheckFailedRequest   { public string TransactionDate { get; set; } = ""; }
    public class InitiateRefundRequest { public long TransactionID { get; set; } public string? RefundRequestID { get; set; } public string? RefundPayGateID { get; set; } public string? RefundBankRRN { get; set; } public string? RefundInitiatedDateTime { get; set; } }
    public class AcceptChargeBackRequest { public long TransactionID { get; set; } }
}
