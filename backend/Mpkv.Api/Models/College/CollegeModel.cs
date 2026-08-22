namespace Mpkv.Api.Models.College
{
    // ══════════════════════════════════════════════════════════════════════════
    // CollegeEntity — mirrors Admission.Entities.CollegeEntity from old project
    // SP: College_SaveCollegeDetails (22 params)
    // ══════════════════════════════════════════════════════════════════════════

    public class CollegeEntity
    {
        public long   CollegeID                  { get; set; }
        public string CollegeCode                { get; set; } = string.Empty;
        public string CollegeName                { get; set; } = string.Empty;
        public string CollegeAddress             { get; set; } = string.Empty;
        public int    DistrictID                 { get; set; }
        public string Taluka                     { get; set; } = string.Empty;
        public string City                       { get; set; } = string.Empty;
        public string Pincode                    { get; set; } = string.Empty;
        public string MobileNo                   { get; set; } = string.Empty;
        public string EmailID                    { get; set; } = string.Empty;
        public short  CourseID                   { get; set; }
        public short  CourseStatusID             { get; set; }
        public short  Intake                     { get; set; }
        /// <summary>1 = YES, 0 = NO</summary>
        public short  HasManagementQuota         { get; set; }
        public string PrincipalName              { get; set; } = string.Empty;
        public string PrincipalEmailID           { get; set; } = string.Empty;
        public string PrincipalMobileNo          { get; set; } = string.Empty;
        public string AdmissionInchargeName      { get; set; } = string.Empty;
        public string AdmissionInchargeEmailID   { get; set; } = string.Empty;
        public string AdmissionInchargeMobileNo  { get; set; } = string.Empty;
        // Audit
        public string UserLoginID                { get; set; } = string.Empty;
        public string IPAddress                  { get; set; } = string.Empty;
    }

    // ── Save request (body of POST /api/college/save) ─────────────────────────
    public class SaveCollegeRequest
    {
        public string CollegeAddress             { get; set; } = string.Empty;
        public string Taluka                     { get; set; } = string.Empty;
        public string City                       { get; set; } = string.Empty;
        public string Pincode                    { get; set; } = string.Empty;
        public string MobileNo                   { get; set; } = string.Empty;
        public string EmailID                    { get; set; } = string.Empty;
        public string PrincipalName              { get; set; } = string.Empty;
        public string PrincipalEmailID           { get; set; } = string.Empty;
        public string PrincipalMobileNo          { get; set; } = string.Empty;
        public string AdmissionInchargeName      { get; set; } = string.Empty;
        public string AdmissionInchargeEmailID   { get; set; } = string.Empty;
        public string AdmissionInchargeMobileNo  { get; set; } = string.Empty;

        // Admin-only fields (ignored / locked when UserTypeID == 61)
        public string CollegeName                { get; set; } = string.Empty;
        public string CollegeCode                { get; set; } = string.Empty;
        public int    DistrictID                 { get; set; }
        public short  CourseID                   { get; set; }
        public short  CourseStatusID             { get; set; }
        public short  Intake                     { get; set; }
        public short  HasManagementQuota         { get; set; }
    }

    // ── Generic API response ──────────────────────────────────────────────────
    public class CollegeActionResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
