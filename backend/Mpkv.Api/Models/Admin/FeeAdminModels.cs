namespace Mpkv.Api.Models.Admin
{
    // ── Fee Refund Transaction Row ─────────────────────────────────────────────
    public class FeeRefundTransactionRow
    {
        public long   TransactionID         { get; set; }
        public string PayeeApplicationID    { get; set; } = "";
        public string PayeeName             { get; set; } = "";
        public string Purpose               { get; set; } = "";
        public string FeeAmount             { get; set; } = "";
        public string PaymentDate           { get; set; } = "";
        public string BankReferenceNo       { get; set; } = "";
        public string PayGateID             { get; set; } = "";
        public string TransactionStatus     { get; set; } = "";
        public string RefundRequestID       { get; set; } = "";
        public string RefundPayGateID       { get; set; } = "";
        public string RefundBankRRN         { get; set; } = "";
        public string RefundInitiatedDate   { get; set; } = "";
        public string RefundedDate          { get; set; } = "";
        public string ChargeBackDate        { get; set; } = "";
        public bool   IsEligibleForRefund   { get; set; }
        public string ReceiptURL            { get; set; } = "";
    }

    // ── Response Models ────────────────────────────────────────────────────────
    public class FeeAdminListResponse
    {
        public bool   Success          { get; set; }
        public string Message          { get; set; } = "";
        public string PayeeApplicationID{ get; set; } = "";
        public string PayeeName        { get; set; } = "";
        public List<FeeRefundTransactionRow> Items { get; set; } = new();
    }

    public class FeeAdminActionResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public int    Count   { get; set; }
    }
}
