namespace Mpkv.Api.Models.Admin
{
    // ── Phase List ────────────────────────────────────────────────────────────
    public class PhaseListResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public List<PhaseItem> Items { get; set; } = new();
    }

    public class PhaseItem
    {
        public int    PhaseID                    { get; set; }
        public string Phase                      { get; set; } = "";
        public string AllotmentDisplayStartDate  { get; set; } = "";
        public string AdmissionStartDate         { get; set; } = "";
        public string CandidateAdmissionLastDate { get; set; } = "";
        public string CollegeAdmissionLastDate   { get; set; } = "";
        public string SystemAdmissionLastDate    { get; set; } = "";
        public bool   IsCurrentPhase             { get; set; }
        public bool   IsCounsellingPhase         { get; set; }
        public bool   IsActive                   { get; set; }
    }

    // ── Phase Details (for edit form) ─────────────────────────────────────────
    public class PhaseDetailsResponse
    {
        public bool      Success { get; set; }
        public string    Message { get; set; } = "";
        public PhaseItem? Item   { get; set; }
    }

    // ── Save Phase (insert PhaseID=0, update PhaseID>0) ───────────────────────
    public class SavePhaseRequest
    {
        public int    PhaseID                    { get; set; }   // 0 = add, >0 = edit
        public string Phase                      { get; set; } = "";
        public string AllotmentDisplayStartDate  { get; set; } = "";
        public string AdmissionStartDate         { get; set; } = "";
        public string CandidateAdmissionLastDate { get; set; } = "";
        public string CollegeAdmissionLastDate   { get; set; } = "";
        public string SystemAdmissionLastDate    { get; set; } = "";
        public bool   IsCurrentPhase             { get; set; }
        public bool   IsCounsellingPhase         { get; set; }
        public bool   IsActive                   { get; set; }
    }

    public class SavePhaseResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
    }

    // ── Delete Phase ──────────────────────────────────────────────────────────
    public class DeletePhaseResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
    }
}
