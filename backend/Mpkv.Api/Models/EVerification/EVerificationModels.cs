namespace Mpkv.Api.Models.EVerification
{
    // ── Dashboard ─────────────────────────────────────────────────────────────
    public class EVDashboardResponse
    {
        public bool   Success          { get; set; }
        public string Message          { get; set; } = "";
        public string UserLoginID      { get; set; } = "";
        public string UserName         { get; set; } = "";
        public string UserType         { get; set; } = "";
        public string CurrentLoginDateTime { get; set; } = "";
        public string LastLoginDateTime    { get; set; } = "";
        // Stats from Dashboard_GetEVerificationDashboard
        public string Total            { get; set; } = "0";
        public string FullyVerified    { get; set; } = "0";
        public string PartiallyVerified{ get; set; } = "0";
        public string NotAssigned      { get; set; } = "0";
        public string NotVerified      { get; set; } = "0";
        public string ReUploaded       { get; set; } = "0";
        public bool   IsEVCSupervisor  { get; set; }   // UserTypeID == 41
    }

    // ── Candidate List ────────────────────────────────────────────────────────
    public class EVCandidateListResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public List<EVCandidateItem> Items { get; set; } = new();
    }

    public class EVCandidateItem
    {
        public long   CandidateID   { get; set; }
        public string ApplicationID { get; set; } = "";
        public string CandidateName { get; set; } = "";
        public string Course        { get; set; } = "";
        public string MobileNo      { get; set; } = "";
        public string Status        { get; set; } = "";
    }

    // ── Check Application ID ──────────────────────────────────────────────────
    public class EVCheckAppIDResponse
    {
        public bool   Success       { get; set; }
        public string Message       { get; set; } = "";
        public long   CandidateID   { get; set; }
        public string ApplicationID { get; set; } = "";
        public string CandidateName { get; set; } = "";
        public string Course        { get; set; } = "";
        public string MobileNo      { get; set; } = "";
        public bool   IsFormLocked  { get; set; }
    }

    // ── Allot Candidate to EVC ────────────────────────────────────────────────
    public class EVAllotResponse
    {
        public bool   Success     { get; set; }
        public string Message     { get; set; } = "";
        public long   CandidateID { get; set; }
    }

    // ── Document Verification ─────────────────────────────────────────────────
    public class EVDocumentListResponse
    {
        public bool   Success       { get; set; }
        public string Message       { get; set; } = "";
        public long   CandidateID   { get; set; }
        public string ApplicationID { get; set; } = "";
        public string CandidateName { get; set; } = "";
        public string PhotoURL      { get; set; } = "";
        public string SignURL        { get; set; } = "";
        public List<EVDocumentItem> Documents { get; set; } = new();
    }

    public class EVDocumentItem
    {
        public int    DocumentID                 { get; set; }
        public string DocumentName               { get; set; } = "";
        public string IsDocumentCompulsory       { get; set; } = "";
        public string IsDocumentUploaded         { get; set; } = "";
        public string DocumentUploadedURL        { get; set; } = "";
        public string DocumentVerificationStatus { get; set; } = "";   // "Verified" / "Not Verified" / ""
        public string VerificationComments       { get; set; } = "";
    }

    // ── Save Verification ─────────────────────────────────────────────────────
    public class EVSaveVerificationRequest
    {
        public long   CandidateID { get; set; }
        public List<EVDocumentVerificationItem> Documents { get; set; } = new();
    }

    public class EVDocumentVerificationItem
    {
        public int    DocumentID            { get; set; }
        public string VerificationStatus    { get; set; } = "";   // "Y" or "N"
        public string VerificationComments  { get; set; } = "";
    }

    public class EVSaveVerificationResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
    }

    // ── EVC Wise Report ───────────────────────────────────────────────────────
    public class EVCWiseReportResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public List<EVCWiseReportItem> Items  { get; set; } = new();
        public EVCWiseReportTotals?    Totals { get; set; }
    }

    public class EVCWiseReportItem
    {
        public long   EVCID                  { get; set; }
        public string EVCCode                { get; set; } = "";
        // SP returns "x + 0" format strings — keep as strings, parse in frontend
        public string TotalForms             { get; set; } = "0";
        public string NotVerifiedForms       { get; set; } = "0";
        public string ReUploadedForms        { get; set; } = "0";
        public string PartiallyVerifiedForms { get; set; } = "0";
        public string FullyVerifiedForms     { get; set; } = "0";
    }

    public class EVCWiseReportTotals
    {
        public string TotalForms             { get; set; } = "0";
        public string NotVerifiedForms       { get; set; } = "0";
        public string ReUploadedForms        { get; set; } = "0";
        public string PartiallyVerifiedForms { get; set; } = "0";
        public string FullyVerifiedForms     { get; set; } = "0";
    }

    // ── EVC Wise Candidate List ───────────────────────────────────────────────
    public class EVCWiseCandidateListResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public List<EVCWiseCandidateItem> Items { get; set; } = new();
    }

    public class EVCWiseCandidateItem
    {
        public string AppliedCourse      { get; set; } = "";
        public string ApplicationID      { get; set; } = "";
        public string CandidateName      { get; set; } = "";
        public string Category           { get; set; } = "";
        public string VerificationStatus { get; set; } = "";
    }

    // ── Eligible Candidates for EVerification ─────────────────────────────────
    public class EVEligibleCandidatesResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public List<EVEligibleCandidateItem> Items { get; set; } = new();
    }

    public class EVEligibleCandidateItem
    {
        public string AppliedCourse      { get; set; } = "";
        public string ApplicationID      { get; set; } = "";
        public string CandidateName      { get; set; } = "";
        public string Category           { get; set; } = "";
        public string AssignedTo         { get; set; } = "";
        public string VerificationStatus { get; set; } = "";
    }
}
