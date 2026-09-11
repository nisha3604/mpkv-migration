namespace Mpkv.Api.Helpers
{
    /// <summary>
    /// UserTypeID constants — mirrors the values in the old project's Session["UserInfo"].UserTypeID.
    /// Used throughout controllers for role-based access control.
    /// </summary>
    public static class UserTypeHelper
    {
        public const int Admin        = 11;   // Super Admin
        public const int Admin2       = 12;   // Secondary Admin (same permissions as Admin)
        public const int College      = 61;   // College user (self-service only)
        public const int Candidate    = 91;   // Candidate
        public const int EVC          = 41;   // EVC Coordinator (e-Verification Centre supervisor)
        public const int SubEVC       = 42;   // Sub-EVC Coordinator

        /// <summary>Returns true if the UserTypeID belongs to an admin role.</summary>
        public static bool IsAdmin(int userTypeId)
            => userTypeId == Admin || userTypeId == Admin2;

        /// <summary>Returns true if the UserTypeID is a college user.</summary>
        public static bool IsCollege(int userTypeId)
            => userTypeId == College;

        /// <summary>Returns true if the UserTypeID is a candidate.</summary>
        public static bool IsCandidate(int userTypeId)
            => userTypeId == Candidate;

        /// <summary>Returns true if the UserTypeID is an EVC or Sub-EVC user.</summary>
        public static bool IsEVC(int userTypeId)
            => userTypeId == EVC || userTypeId == SubEVC;

        /// <summary>
        /// Returns the dashboard React route for each user type.
        /// Mirrors: LoggedInUser.DashBoardPath in the old project,
        /// but mapped to the new React routing convention.
        /// </summary>
        public static string GetDashboardRoute(int userTypeId) => userTypeId switch
        {
            Admin     => "/admin/dashboard",
            Admin2    => "/admin/dashboard",
            College   => "/college/dashboard",
            Candidate => "/candidate/dashboard",
            EVC       => "/everification/dashboard",
            SubEVC    => "/everification/dashboard",
            _         => "/"
        };
    }
}
