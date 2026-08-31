namespace Mpkv.Api.Models.Auth
{
    /// <summary>
    /// Represents the logged-in user — mirrors LoggedInUser entity from old project.
    /// Stored in JWT claims. All user types (Candidate 91, College 61, Admin 11/12) use this.
    /// </summary>
    public class UserInfo
    {
        public long   UserID       { get; set; }
        public string UserLoginID  { get; set; } = string.Empty;
        public string UserName     { get; set; } = string.Empty;
        /// <summary>11=Admin, 12=Admin2, 61=College, 91=Candidate</summary>
        public int    UserTypeID   { get; set; }
        /// <summary>React route to redirect after login, e.g. /candidate/dashboard</summary>
        public string DashBoardPath{ get; set; } = string.Empty;
        public string PhotoPath    { get; set; } = string.Empty;
        public int    CourseID     { get; set; }
        public int    DistrictID   { get; set; }
        public bool   IsAdmin      { get; set; }
        /// <summary>
        /// Captured from Account_CheckUserExists BEFORE UpdateLoginStatus runs.
        /// This is the genuine previous-session login time shown on the dashboard.
        /// </summary>
        public string LastLoginDateTime    { get; set; } = string.Empty;
        /// <summary>Set to DateTime.Now at login time — shown as Current Login Time.</summary>
        public string CurrentLoginDateTime { get; set; } = string.Empty;
    }
}
