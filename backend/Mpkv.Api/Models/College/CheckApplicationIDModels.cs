namespace Mpkv.Api.Models.College
{
    // ══════════════════════════════════════════════════════════════════════════
    // CheckApplicationID — mirrors CheckApplicationID.aspx + .aspx.cs
    // One page handles 5 flags:
    //   ConfirmAdmission, CancelAdmission, PrintAdmissionLetter,
    //   PrintAdmissionCancellationLetter, PrintAdmissionRejectionLetter
    //
    // SP: Admission_GetReportingDetails(
    //       @CandidateID, @EncryptedCandidateID, @PhaseID,
    //       @ReportingStatus, @UserLoginID, @Flag)
    // Returns: DataTable with columns ProceedURL, CollegeName, Course, CourseStatus
    // ══════════════════════════════════════════════════════════════════════════

    public class CheckApplicationIDRequest
    {
        public string ApplicationID { get; set; } = string.Empty;
        public short  PhaseID       { get; set; }   // only used for ConfirmAdmission
        /// <summary>
        /// ConfirmAdmission | CancelAdmission | PrintAdmissionLetter |
        /// PrintAdmissionCancellationLetter | PrintAdmissionRejectionLetter
        /// </summary>
        public string Flag          { get; set; } = string.Empty;
    }

    public class ReportingDetailItem
    {
        public string ProceedURL   { get; set; } = string.Empty;  // HTML link from SP
        public string CollegeName  { get; set; } = string.Empty;
        public string Course       { get; set; } = string.Empty;
        public string CourseStatus { get; set; } = string.Empty;
    }

    public class CheckApplicationIDResponse
    {
        public bool   Success       { get; set; }
        public string Message       { get; set; } = string.Empty;
        public string ApplicationID { get; set; } = string.Empty;
        public string CandidateName { get; set; } = string.Empty;
        public List<ReportingDetailItem> Items { get; set; } = new();
    }
}
