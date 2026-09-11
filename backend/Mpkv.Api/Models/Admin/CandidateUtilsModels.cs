namespace Mpkv.Api.Models.Admin
{
    // ── Search Candidate ──────────────────────────────────────────────────────
    public class SearchCandidateRequest
    {
        /// <summary>ApplicationID | CandidateName | MobileNo | EMailID</summary>
        public string SearchBy   { get; set; } = "ApplicationID";
        public string SearchText { get; set; } = "";
    }

    public class SearchCandidateResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public List<CandidateSearchRow> Items { get; set; } = new();
    }

    public class CandidateSearchRow
    {
        public long   CandidateID  { get; set; }
        public string ApplicationID{ get; set; } = "";
        public string CandidateName{ get; set; } = "";
        public string Gender       { get; set; } = "";
        public string DOB          { get; set; } = "";
        public string MobileNo     { get; set; } = "";
        public string EMailID      { get; set; } = "";
    }

    // ── Reset Candidate Password ──────────────────────────────────────────────
    public class CandidatePasswordInfoResponse
    {
        public bool   Success        { get; set; }
        public string Message        { get; set; } = "";
        public long   CandidateID    { get; set; }
        public string ApplicationID  { get; set; } = "";
        public string CandidateName  { get; set; } = "";
        /// <summary>Decoded current password for display (mirrors old project)</summary>
        public string CurrentPassword{ get; set; } = "";
    }

    public class ResetCandidatePasswordRequest
    {
        public long   CandidateID    { get; set; }
        public string ApplicationID  { get; set; } = "";
        public string NewPassword    { get; set; } = "";
        public string ConfirmPassword{ get; set; } = "";
    }

    public class ResetCandidatePasswordResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
    }

    // ── Document Verification Status ──────────────────────────────────────────
    public class DocVerificationStatusResponse
    {
        public bool   Success      { get; set; }
        public string Message      { get; set; } = "";
        public string CandidateName{ get; set; } = "";
        public string ApplicationID{ get; set; } = "";
        public List<DocVerificationRow> Documents { get; set; } = new();
    }

    public class DocVerificationRow
    {
        public int    DocumentID                 { get; set; }
        public string DocumentName               { get; set; } = "";
        public string IsDocumentCompulsory       { get; set; } = "";
        public string IsDocumentUploaded         { get; set; } = "";
        public string DocumentUploadedURL        { get; set; } = "";
        public string DocumentVerificationStatus   { get; set; } = "";
        public string DocumentVerificationComments { get; set; } = "";
        public string DocumentVerificationDate     { get; set; } = "";
    }

    // ── Unlock Candidate Form (Admin Override) ────────────────────────────────
    // Mirrors ApplicationFormUnlock.aspx CloseConfirmBoxYes (admin path)
    // SP: ApplicationForm_UnlockForm(@CandidateID, @UserLoginID, @IPAddress, @PageCode)
    public class UnlockCandidateFormResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
    }
}
