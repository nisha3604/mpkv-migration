namespace Mpkv.Api.Models.College
{
    // ══════════════════════════════════════════════════════════════════════════
    // College summary / list DTOs — returned to frontend for display
    // SP: College_GetCollegeSummary, College_GetCollegeList, College_GetCollegeDetails
    // ══════════════════════════════════════════════════════════════════════════

    public class CollegeSummaryDto
    {
        public long   CollegeID                  { get; set; }
        public string CollegeCode                { get; set; } = string.Empty;
        public string CollegeName                { get; set; } = string.Empty;
        public string CollegeAddress             { get; set; } = string.Empty;
        public string District                   { get; set; } = string.Empty;
        public int    DistrictID                 { get; set; }
        public string Taluka                     { get; set; } = string.Empty;
        public string City                       { get; set; } = string.Empty;
        public string Pincode                    { get; set; } = string.Empty;
        public string MobileNo                   { get; set; } = string.Empty;
        public string EmailID                    { get; set; } = string.Empty;
        public string Course                     { get; set; } = string.Empty;
        public short  CourseID                   { get; set; }
        public string CourseStatus               { get; set; } = string.Empty;
        public short  CourseStatusID             { get; set; }
        public short  Intake                     { get; set; }
        public string HasManagementQuota         { get; set; } = string.Empty;  // "YES" / "NO"
        public short  HasManagementQuotaValue    { get; set; }
        public string PrincipalName              { get; set; } = string.Empty;
        public string PrincipalEmailID           { get; set; } = string.Empty;
        public string PrincipalMobileNo          { get; set; } = string.Empty;
        public string AdmissionInchargeName      { get; set; } = string.Empty;
        public string AdmissionInchargeEmailID   { get; set; } = string.Empty;
        public string AdmissionInchargeMobileNo  { get; set; } = string.Empty;
        public bool   IsActive                   { get; set; }
    }

    public class CollegeSummaryResponse
    {
        public bool              Success { get; set; }
        public string            Message { get; set; } = string.Empty;
        public CollegeSummaryDto? College { get; set; }
    }

    public class CollegeDetailsResponse
    {
        public bool              Success  { get; set; }
        public string            Message  { get; set; } = string.Empty;
        public CollegeSummaryDto? Details  { get; set; }
        public List<DropdownItem> Districts    { get; set; } = new();
        public List<DropdownItem> Courses      { get; set; } = new();
        public List<DropdownItem> CourseStatuses{ get; set; } = new();
    }

    public class CollegeListItem
    {
        public long   CollegeID     { get; set; }
        public string CollegeCode   { get; set; } = string.Empty;
        public string CollegeName   { get; set; } = string.Empty;
        public string District      { get; set; } = string.Empty;
        public string Course        { get; set; } = string.Empty;
        public string CourseStatus  { get; set; } = string.Empty;
        public string Status        { get; set; } = string.Empty;
        public bool   IsActive      { get; set; }
    }

    public class CollegeListResponse
    {
        public bool                  Success  { get; set; }
        public string                Message  { get; set; } = string.Empty;
        public List<CollegeListItem> Colleges { get; set; } = new();
    }

    public class CollegeListRequest
    {
        public short  CourseID    { get; set; }
        public int    DistrictID  { get; set; }
        public string CollegeCode { get; set; } = string.Empty;
        public string CollegeName { get; set; } = string.Empty;
    }

    public class DropdownItem
    {
        public string Value { get; set; } = string.Empty;
        public string Text  { get; set; } = string.Empty;
    }
}
