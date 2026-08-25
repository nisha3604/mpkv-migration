using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Models.Candidate;
using Mpkv.Api.Services;

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

        // GET /api/fee/transaction-history — mirrors PaymentHistory.aspx
        [HttpGet("transaction-history"), Authorize]
        public IActionResult GetTransactionHistory()
        {
            var candidateId = long.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0", out var id) ? id : 0;
            if (candidateId <= 0) return Unauthorized();
            return Ok(_feeService.GetTransactionHistory(candidateId));
        }

        // GET /api/fee/receipt/{transactionId} — mirrors PaymentReceipt.aspx
        // Returns transaction details for print receipt (no auth check on transactionId —
        // FeeService.GetTransactionDetails already fetches by TransactionID)
        [HttpGet("receipt/{transactionId}"), Authorize]
        public IActionResult GetReceipt(long transactionId)
        {
            if (transactionId <= 0) return BadRequest(new { message = "Invalid transaction ID." });
            var tx = _feeService.GetTransactionDetails(transactionId);
            if (tx == null || tx.TransactionID <= 0)
                return NotFound(new { message = "Transaction not found." });
            return Ok(tx);
        }
    }
}
