namespace Mpkv.Api.Models.College
{
    // ══════════════════════════════════════════════════════════════════════════
    // Allotment Status — mirrors CheckAllotmentStatus.aspx
    // SPs: Admission_GetPhaseList, Admission_GetCurrentPhaseID,
    //      Admission_GetAllotmentStatus, Admission_SaveDownloadAllotmentLetterStatus,
    //      Admission_GetCategoryConversionFeeDetails, Fee_SetFeeTransaction
    // ══════════════════════════════════════════════════════════════════════════

    public class PhaseItem
    {
        public string Value { get; set; } = string.Empty;
        public string Text  { get; set; } = string.Empty;
    }

    public class PhaseListResponse
    {
        public bool          Success       { get; set; }
        public string        Message       { get; set; } = string.Empty;
        public List<PhaseItem> Phases      { get; set; } = new();
        public int           CurrentPhaseID{ get; set; }
    }

    public class RefusalFeeItem
    {
        public string TransactionID   { get; set; } = string.Empty;
        public string FeeAmount        { get; set; } = string.Empty;
        public string TransactionDate  { get; set; } = string.Empty;
        public string PaymentDate      { get; set; } = string.Empty;
        public string BankReferenceNo  { get; set; } = string.Empty;
        public string Purpose          { get; set; } = string.Empty;
    }

    public class AllotmentStatusDto
    {
        // Personal details
        public string AppliedCourse     { get; set; } = string.Empty;
        public string ApplicationID     { get; set; } = string.Empty;
        public string CandidateName     { get; set; } = string.Empty;
        public string Gender            { get; set; } = string.Empty;
        public string DOB               { get; set; } = string.Empty;
        public string DomicileDistrict  { get; set; } = string.Empty;
        public string Category          { get; set; } = string.Empty;
        public string PhotoURL          { get; set; } = string.Empty;
        public string SignURL            { get; set; } = string.Empty;

        // Weightage / points table
        public string AcademicWeightage     { get; set; } = string.Empty;
        public string Weightage712          { get; set; } = string.Empty;  // 7/12 weightage
        public string NCCWeightage          { get; set; } = string.Empty;
        public string SportWeightage        { get; set; } = string.Empty;
        public string MPKVEmployeeWeightage { get; set; } = string.Empty;
        public string TotalWeightage        { get; set; } = string.Empty;

        // Allotment status
        public string AllotmentPhase        { get; set; } = string.Empty;
        public string AllottedCollege       { get; set; } = string.Empty;  // "CODE - Name"
        public string AllottedCourse        { get; set; } = string.Empty;
        public string AllottedCategory      { get; set; } = string.Empty;
        public string AllottedType          { get; set; } = string.Empty;
        public string AdmissionSchedule     { get; set; } = string.Empty;

        // Refusal fee
        public int    RefusalRemainingFee   { get; set; }

        // Flags
        public bool   IsAllotmentLetterDownloaded        { get; set; }
        public bool   IsEligibleToDownloadAllotmentLetter{ get; set; }

        // IDs needed for actions
        public long   CandidateID  { get; set; }
        public long   CollegeID    { get; set; }
        public int    PhaseID      { get; set; }
        public string AllottedCollegeCode { get; set; } = string.Empty;

        // Refusal fee payment history (Tables[1])
        public List<RefusalFeeItem> RefusalFeePayments { get; set; } = new();
    }

    public class AllotmentStatusResponse
    {
        public bool               Success  { get; set; }
        public string             Message  { get; set; } = string.Empty;
        public AllotmentStatusDto? Data    { get; set; }
    }

    public class CheckAllotmentRequest
    {
        public string ApplicationID { get; set; } = string.Empty;
        public short  PhaseID       { get; set; }
    }

    public class DownloadAllotmentLetterRequest
    {
        public long  CandidateID { get; set; }
        public long  CollegeID   { get; set; }
        public short PhaseID     { get; set; }
    }

    public class DownloadAllotmentLetterResponse
    {
        public bool   Success     { get; set; }
        public string Message     { get; set; } = string.Empty;
        /// <summary>URL to open the allotment letter print page</summary>
        public string PrintUrl    { get; set; } = string.Empty;
    }

    public class RefusalFeeInitiateRequest
    {
        public long  CandidateID      { get; set; }
        public int   PhaseID          { get; set; }
        public short PaymentGatewayID { get; set; }
    }

    public class RefusalFeeInitiateResponse
    {
        public bool   Success           { get; set; }
        public string Message           { get; set; } = string.Empty;
        public long   TransactionID     { get; set; }
        public string PaymentGatewayURL { get; set; } = string.Empty;
    }
}
