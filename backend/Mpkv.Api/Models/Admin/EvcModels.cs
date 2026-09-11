namespace Mpkv.Api.Models.Admin
{
    // ── EVC List ──────────────────────────────────────────────────────────────
    public class EvcListResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public List<EvcListItem> Items { get; set; } = new();
    }

    public class EvcListItem
    {
        public long   EVCID               { get; set; }
        public string EVCCode             { get; set; } = "";
        public string CoordinatorName     { get; set; } = "";
        public string CoordinatorMobileNo { get; set; } = "";
        public string CoordinatorEMailID  { get; set; } = "";
        public string IsActive            { get; set; } = "";
    }

    // ── EVC Details (Add / Edit) ───────────────────────────────────────────────
    public class EvcDetailsResponse
    {
        public bool      Success { get; set; }
        public string    Message { get; set; } = "";
        public EvcDetail Detail  { get; set; } = new();
    }

    public class EvcDetail
    {
        public long   EVCID               { get; set; }
        public long   ParentEVCID         { get; set; }
        public string EVCCode             { get; set; } = "";
        public string CoordinatorName     { get; set; } = "";
        public string CoordinatorMobileNo { get; set; } = "";
        public string CoordinatorEMailID  { get; set; } = "";
    }

    // ── Save EVC / Sub-EVC ────────────────────────────────────────────────────
    public class SaveEvcRequest
    {
        public long   EVCID               { get; set; }   // 0 = add, >0 = edit
        public long   ParentEVCID         { get; set; }   // 0 for top-level EVC
        public string CoordinatorName     { get; set; } = "";
        public string CoordinatorMobileNo { get; set; } = "";
        public string CoordinatorEMailID  { get; set; } = "";
    }

    public class SaveEvcResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
    }

    // ── Activate / Deactivate ─────────────────────────────────────────────────
    public class ToggleEvcResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
    }
}
