namespace Mpkv.Api.Models.Admin
{
    // ── User Type dropdown ────────────────────────────────────────────────────
    public class UserTypeItem
    {
        public string Value { get; set; } = "";
        public string Text  { get; set; } = "";
    }

    public class UserTypesResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public List<UserTypeItem> Items { get; set; } = new();
    }

    // ── User List ─────────────────────────────────────────────────────────────
    public class UserListResponse
    {
        public bool   Success    { get; set; }
        public string Message    { get; set; } = "";
        public int    UserTypeID { get; set; }
        public List<UserItem> Items { get; set; } = new();
    }

    public class UserItem
    {
        public long   UserID      { get; set; }
        public int    UserTypeID  { get; set; }
        public string UserType    { get; set; } = "";
        public string UserLoginID { get; set; } = "";
        /// <summary>Plain-text password (decoded from Base64 for display)</summary>
        public string Password    { get; set; } = "";
        public string UserName    { get; set; } = "";
        public string UserMobileNo{ get; set; } = "";
        public string UserEMailID { get; set; } = "";
        public string IsActive    { get; set; } = "";
        /// <summary>"Activate" or "Deactivate" — text for toggle button</summary>
        public string ActivOrDeactive { get; set; } = "";
    }

    // ── Save User (Add = UserID 0, Edit = UserID > 0) ─────────────────────────
    public class SaveUserRequest
    {
        /// <summary>0 = new user; >0 = edit existing</summary>
        public long   UserID      { get; set; }
        public int    UserTypeID  { get; set; }
        public string UserName    { get; set; } = "";
        public string UserMobileNo{ get; set; } = "";
        public string UserEMailID { get; set; } = "";
    }

    public class SaveUserResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
    }

    // ── Activate / Deactivate ─────────────────────────────────────────────────
    public class ToggleUserResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
    }

    // ── Send SMS ──────────────────────────────────────────────────────────────
    public class SendSmsResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
    }

    // ── Get User Details (for edit pre-fill) ──────────────────────────────────
    public class UserDetailsResponse
    {
        public bool     Success { get; set; }
        public string   Message { get; set; } = "";
        public UserItem? User   { get; set; }
    }
}
