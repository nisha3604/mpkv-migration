namespace Mpkv.Api.Models.College
{
    // ══════════════════════════════════════════════════════════════════════════
    // Edit User Profile — mirrors Administration/EditUserProfile.aspx
    // SPs:
    //   Administration_GetUserDetails(@UserID) → UserName, UserMobileNo, UserEMailID
    //   Administration_EditUser(@UserID, @UserTypeID, @UserName,
    //       @UserMobileNo, @UserEMailID, @ModifiedBy, @ModifiedByIPAddress)
    //   Returns "Y" on success
    // ══════════════════════════════════════════════════════════════════════════

    public class UserProfileDto
    {
        public string UserName     { get; set; } = string.Empty;
        public string UserMobileNo { get; set; } = string.Empty;
        public string UserEMailID  { get; set; } = string.Empty;
    }

    public class UserProfileResponse
    {
        public bool        Success { get; set; }
        public string      Message { get; set; } = string.Empty;
        public UserProfileDto? Profile { get; set; }
    }

    public class SaveUserProfileRequest
    {
        public string UserName     { get; set; } = string.Empty;
        public string UserMobileNo { get; set; } = string.Empty;
        public string UserEMailID  { get; set; } = string.Empty;
    }

    public class SaveUserProfileResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
