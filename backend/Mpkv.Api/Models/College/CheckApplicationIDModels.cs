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

    // ── Admission Summary (ConfirmAdmission.aspx GetAdmissionSummary) ──────────
    public class AdmissionSummaryResponse
    {
        public bool   Success                      { get; set; }
        public string Message                      { get; set; } = "";
        // Candidate info
        public string ApplicationID                { get; set; } = "";
        public string AppliedCourse                { get; set; } = "";
        public string CandidateName                { get; set; } = "";
        public string FatherName                   { get; set; } = "";
        public string MotherName                   { get; set; } = "";
        public string Gender                       { get; set; } = "";
        public string DOB                          { get; set; } = "";
        public string MobileNo                     { get; set; } = "";
        public string EMailID                      { get; set; } = "";
        public string Category                     { get; set; } = "";
        public string DomicileDistrict             { get; set; } = "";
        public string EligibilityQualification     { get; set; } = "";
        public string EligibilityQualificationMarks{ get; set; } = "";
        public string PhotoURL                     { get; set; } = "";
        public string SignURL                      { get; set; } = "";
        // Weightage
        public string AcademicWeightage            { get; set; } = "";
        public string Weightage712                 { get; set; } = "";
        public string NCCWeightage                 { get; set; } = "";
        public string SportWeightage               { get; set; } = "";
        public string MPKVEmployeeWeightage        { get; set; } = "";
        public string TotalWeightage               { get; set; } = "";
        public string MeritNo                      { get; set; } = "";
        // Allotment
        public string AllotmentPhase               { get; set; } = "";
        public string AllottedCollegeCode          { get; set; } = "";
        public string AllottedCollege              { get; set; } = "";
        public string AllottedCourse               { get; set; } = "";
        public string AllottedCategory             { get; set; } = "";
        public string AllottedType                 { get; set; } = "";
        public string AllottedTypeDisplay          { get; set; } = "";
        public string AllotmentDate                { get; set; } = "";
        // Reporting status
        public string ReportingStatus              { get; set; } = "";
        public string AdmissionComments            { get; set; } = "";
        // Letter extra fields (AdmissionLetter / CancellationLetter / RejectionLetter)
        public string AllottedCourseStatus         { get; set; } = "";
        public string PrintedOn                    { get; set; } = "";
        public string ReportedOn                   { get; set; } = "";
        public string ReportedBy                   { get; set; } = "";
        public string CancellationComments         { get; set; } = "";
        public string CancelledOn                  { get; set; } = "";
        public string CancelledBy                  { get; set; } = "";
        // Nodal officer (from viewCollegeInformation via service join)
        public string NodalOfficerName             { get; set; } = "";
        public string NodalOfficerMobileNo         { get; set; } = "";
        public string NodalOfficerEMailID          { get; set; } = "";
        public string CollegeWebsite               { get; set; } = "";
        // Documents
        public List<AdmissionDocumentDto> Documents{ get; set; } = new();
    }

    public class AdmissionDocumentDto
    {
        public int    DocumentID                  { get; set; }
        public string DocumentName                { get; set; } = "";
        public string IsDocumentCompulsory        { get; set; } = "";
        public string IsDocumentUploaded          { get; set; } = "";
        public string DocumentUploadedURL         { get; set; } = "";
        public string DocumentVerificationStatus  { get; set; } = "";
        public string DocumentVerificationComments{ get; set; } = "";
        public string FileTypesAllowed            { get; set; } = "pdf";
        public int    MaxFileSizeAllowed          { get; set; } = 1024;
    }

    // Request models
    public class AdmissionSummaryRequest
    {
        public long   CandidateID { get; set; }
        public long   CollegeID   { get; set; }
        public short  PhaseID     { get; set; }
        public string Flag        { get; set; } = "ConfirmAdmission";
    }

    public class DocumentVerificationItem
    {
        public int    DocumentID            { get; set; }
        public string VerificationStatus   { get; set; } = "N";  // Y or N
        public string VerificationComments { get; set; } = "";
    }

    public class ConfirmAdmissionRequest
    {
        public long   CandidateID  { get; set; }
        public long   CollegeID    { get; set; }
        public short  PhaseID      { get; set; }
        public string Comments     { get; set; } = "";
        public List<DocumentVerificationItem> Documents { get; set; } = new();
    }

    public class AdmissionActionResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
    }

    public class UploadAdmissionDocRequest
    {
        public long   CandidateID { get; set; }
        public long   CollegeID   { get; set; }
        public short  PhaseID     { get; set; }
        public int    DocumentID  { get; set; }
        public string DocumentNo  { get; set; } = "";
        public string DocumentIssueDate { get; set; } = "";
    }
}
