namespace Mpkv.Api.Models.College
{

    // ── Allotment Report By Course ────────────────────────────────────────────
    public class AllotmentReportByCourseRow
    {
        public string CourseName                   { get; set; } = string.Empty;
        public int    Allotment                    { get; set; }
        public int    AllotmentRefused             { get; set; }
        public int    AllotmentLetterDownloaded    { get; set; }
        public int    Admitted                     { get; set; }
        public int    Rejected                     { get; set; }
        public int    Cancelled                    { get; set; }
        public long   PhaseID                      { get; set; }
        public long   CollegeID                    { get; set; }
    }

    public class AllotmentReportByCourseResponse
    {
        public bool   Success      { get; set; }
        public string Message      { get; set; } = string.Empty;
        public string CollegeName  { get; set; } = string.Empty;
        public string PhaseName    { get; set; } = string.Empty;
        public List<AllotmentReportByCourseRow> Rows { get; set; } = new();
        public int TotalAllotment                 { get; set; }
        public int TotalAllotmentRefused          { get; set; }
        public int TotalAllotmentLetterDownloaded { get; set; }
        public int TotalAdmitted                  { get; set; }
        public int TotalRejected                  { get; set; }
        public int TotalCancelled                 { get; set; }
    }

    // ── Composite Admission Report By Course ──────────────────────────────────
    public class CompositeAdmissionReportRow
    {
        public string CourseName      { get; set; } = string.Empty;
        public long   CollegeID       { get; set; }
        public int    Intake          { get; set; }
        public int    AdmittedPhase1  { get; set; }
        public int    AdmittedPhase2  { get; set; }
        public int    AdmittedPhase3  { get; set; }
        public int    AdmittedPhase4  { get; set; }
        public int    AdmittedPhase5  { get; set; }
        public int    AdmittedPhase6  { get; set; }
        public int    AdmittedPhase7  { get; set; }
        public int    AdmittedPhase8  { get; set; }
        public int    AdmittedPhase9  { get; set; }
        public int    AdmittedPhase10 { get; set; }
        public int    TotalAdmitted   { get; set; }
        public int    Vacancy         { get; set; }
    }

    public class CompositeAdmissionReportByCourseResponse
    {
        public bool   Success          { get; set; }
        public string Message          { get; set; } = string.Empty;
        public string CollegeName      { get; set; } = string.Empty;
        public int    MaxActivePhaseID { get; set; }
        public List<CompositeAdmissionReportRow> Rows { get; set; } = new();
        public int TotalIntake          { get; set; }
        public int TotalAdmittedPhase1  { get; set; }
        public int TotalAdmittedPhase2  { get; set; }
        public int TotalAdmittedPhase3  { get; set; }
        public int TotalAdmittedPhase4  { get; set; }
        public int TotalAdmittedPhase5  { get; set; }
        public int TotalAdmittedPhase6  { get; set; }
        public int TotalAdmittedPhase7  { get; set; }
        public int TotalAdmittedPhase8  { get; set; }
        public int TotalAdmittedPhase9  { get; set; }
        public int TotalAdmittedPhase10 { get; set; }
        public int TotalTotalAdmitted   { get; set; }
        public int TotalVacancy         { get; set; }
    }

    // ── Candidates Eligible For Counselling ───────────────────────────────────
    // SP: Report_GetCandidatesEligibleForCounselling(@CourseID)
    // CourseID from JWT — no filter on page
    // Access: UserTypeID 11, 12, 61 only
    public class EligibleCandidateRow
    {
        public string AppliedCourse        { get; set; } = string.Empty;
        public string TotalWeightage       { get; set; } = string.Empty;
        public string ApplicationID        { get; set; } = string.Empty;
        public string CandidateName        { get; set; } = string.Empty;
        public string Gender               { get; set; } = string.Empty;
        public string DOB                  { get; set; } = string.Empty;
        public string FinalCategory        { get; set; } = string.Empty;
        public string DomicileDistrict     { get; set; } = string.Empty;
        public string MobileNo             { get; set; } = string.Empty;
        public string EMailID              { get; set; } = string.Empty;
        /// <summary>HtmlEncode=false in old grid — may contain HTML markup</summary>
        public string DocumentsDiscrepancy { get; set; } = string.Empty;
    }

    public class EligibleCandidatesResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<EligibleCandidateRow> Rows { get; set; } = new();
    }
}
