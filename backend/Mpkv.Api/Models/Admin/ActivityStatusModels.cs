namespace Mpkv.Api.Models.Admin
{
    // ── Activity Status (Registration, Fee, etc.) ─────────────────────────────
    public class ActivityStatusListResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public List<ActivityStatusItem> Items { get; set; } = new();
    }

    public class ActivityStatusItem
    {
        public string ActivityName             { get; set; } = "";
        public string ActivityDetails          { get; set; } = "";
        public string ActivityStartDateTime    { get; set; } = "";
        public string ActivityEndDateTime      { get; set; } = "";
    }

    public class SaveActivityStatusRequest
    {
        public string ActivityName             { get; set; } = "";
        public string ActivityStartDateTime    { get; set; } = "";
        public string ActivityEndDateTime      { get; set; } = "";
    }

    public class SaveActivityStatusResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
    }

    // ── Admission Activity Status (per Phase) ─────────────────────────────────
    public class AdmissionActivityListResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public List<AdmissionActivityItem> Items { get; set; } = new();
    }

    public class AdmissionActivityItem
    {
        public int    PhaseID                    { get; set; }
        public string Phase                      { get; set; } = "";
        public string AllotmentDisplayStartDate  { get; set; } = "";
        public string AdmissionStartDate         { get; set; } = "";
        public string CandidateAdmissionLastDate { get; set; } = "";
        public string CollegeAdmissionLastDate   { get; set; } = "";
        public string SystemAdmissionLastDate    { get; set; } = "";
        public bool   IsCurrentPhase             { get; set; }
        public bool   IsActive                   { get; set; }
    }

    public class SaveAdmissionActivityRequest
    {
        public int    PhaseID                    { get; set; }
        public string AllotmentDisplayStartDate  { get; set; } = "";
        public string AdmissionStartDate         { get; set; } = "";
        public string CandidateAdmissionLastDate { get; set; } = "";
        public string CollegeAdmissionLastDate   { get; set; } = "";
        public string SystemAdmissionLastDate    { get; set; } = "";
        public bool   IsCurrentPhase             { get; set; }
        public bool   IsActive                   { get; set; }
    }
}
