namespace Mpkv.Api.Models.Admin
{
    public class AdminDashboardResponse
    {
        public bool   Success { get; set; }
        public string Message { get; set; } = "";
        public AdminDashboardData? Data { get; set; }
    }

    public class AdminDashboardData
    {
        // Session info
        public string UserLoginID          { get; set; } = "";
        public string UserType             { get; set; } = "";
        public string UserName             { get; set; } = "";
        public string CurrentLoginDateTime { get; set; } = "";
        public string LastLoginDateTime    { get; set; } = "";

        // 3 course blocks — suffix _1 = course 1, _2 = course 2, _3 = course 3
        // Course names come from Master_Course ordered by CourseID
        public string CourseName_1 { get; set; } = "";
        public string CourseName_2 { get; set; } = "";
        public string CourseName_3 { get; set; } = "";

        // Candidate stats per course
        public string Registered_1       { get; set; } = "0";
        public string Locked_1           { get; set; } = "0";
        public string FullyVerified_1    { get; set; } = "0";
        public string PartiallyVerified_1{ get; set; } = "0";
        public string Registered_2       { get; set; } = "0";
        public string Locked_2           { get; set; } = "0";
        public string FullyVerified_2    { get; set; } = "0";
        public string PartiallyVerified_2{ get; set; } = "0";
        public string Registered_3       { get; set; } = "0";
        public string Locked_3           { get; set; } = "0";
        public string FullyVerified_3    { get; set; } = "0";
        public string PartiallyVerified_3{ get; set; } = "0";

        // College stats per course
        public string NoOfColleges_1{ get; set; } = "0";
        public string Intake_1      { get; set; } = "0";
        public string Admitted_1    { get; set; } = "0";
        public string Vacancy_1     { get; set; } = "0";
        public string NoOfColleges_2{ get; set; } = "0";
        public string Intake_2      { get; set; } = "0";
        public string Admitted_2    { get; set; } = "0";
        public string Vacancy_2     { get; set; } = "0";
        public string NoOfColleges_3{ get; set; } = "0";
        public string Intake_3      { get; set; } = "0";
        public string Admitted_3    { get; set; } = "0";
        public string Vacancy_3     { get; set; } = "0";
    }
}
