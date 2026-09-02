using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.College;
using System.Data;

namespace Mpkv.Api.Services
{
    public interface IReportService
    {
        PhaseListResponse                          GetPhases(int userTypeId, string userLoginId);
        AllotmentReportByCourseResponse            GetAllotmentReportByCourse(long collegeId, int phaseId);
        CompositeAdmissionReportByCourseResponse   GetCompositeAdmissionReportByCourse(long collegeId);
        EligibleCandidatesResponse                 GetCandidatesEligibleForCounselling(int courseId);
        AllotmentDetailResponse                    GetAllotmentDetail(long collegeId, int phaseId, string flag);
        CompositeDetailResponse                    GetCompositeDetail(long collegeId, int phaseId);
    }

    public class ReportService : IReportService
    {
        private readonly DbAccess _db;
        public ReportService(DbAccess db) => _db = db;

        // ══════════════════════════════════════════════════════════════════════
        // GetPhases — Flag="AllotmentReport"
        // ══════════════════════════════════════════════════════════════════════
        public PhaseListResponse GetPhases(int userTypeId, string userLoginId)
        {
            var response = new PhaseListResponse();
            try
            {
                var param = new DynamicParameters();
                param.Add("@UserTypeID",  userTypeId);
                param.Add("@Flag",        "AllotmentReport");
                param.Add("@UserLoginID", userLoginId);
                var dt = _db.GetDataTable("Admission_GetPhaseList", param);
                if (dt != null)
                    foreach (System.Data.DataRow row in dt.Rows)
                    {
                        var val = row[0]?.ToString() ?? "";
                        if (val == "-1") continue;
                        response.Phases.Add(new PhaseItem { Value = val, Text = row[1]?.ToString() ?? "" });
                    }
                try
                {
                    var cur = _db.ExecuteScalar("Admission_GetCurrentPhaseID");
                    response.CurrentPhaseID = cur != null ? Convert.ToInt32(cur) : 0;
                }
                catch { response.CurrentPhaseID = 0; }
                response.Success = true;
            }
            catch (Exception ex) { response.Success = false; response.Message = ex.Message; }
            return response;
        }

        // ══════════════════════════════════════════════════════════════════════
        // GetAllotmentReportByCourse
        // SP: Report_GetAllotmentReportByCourse(@CollegeID, @PhaseID)
        // SP: Report_GetCollegeName(@CollegeID)
        // ══════════════════════════════════════════════════════════════════════
        public AllotmentReportByCourseResponse GetAllotmentReportByCourse(long collegeId, int phaseId)
        {
            var response = new AllotmentReportByCourseResponse();
            try
            {
                if (collegeId <= 0 || phaseId <= 0)
                    return new AllotmentReportByCourseResponse { Success = false, Message = "Invalid CollegeID or PhaseID." };

                try
                {
                    var np = new DynamicParameters();
                    np.Add("@CollegeID", collegeId);
                    response.CollegeName = _db.ExecuteScalar("Report_GetCollegeName", np)?.ToString() ?? "";
                }
                catch { response.CollegeName = ""; }

                var param = new DynamicParameters();
                param.Add("@CollegeID", collegeId);
                param.Add("@PhaseID",   (short)phaseId);
                var dt = _db.GetDataTable("Report_GetAllotmentReportByCourse", param);

                if (dt == null || dt.Rows.Count == 0) { response.Success = true; return response; }

                bool HC(string n) => dt.Columns.Contains(n);
                int t1=0,t2=0,t3=0,t4=0,t5=0,t6=0;
                foreach (System.Data.DataRow row in dt.Rows)
                {
                    int a1 = HC("Allotment")                 && row["Allotment"]                 != DBNull.Value ? Convert.ToInt32(row["Allotment"])                 : 0;
                    int a2 = HC("AllotmentRefused")          && row["AllotmentRefused"]          != DBNull.Value ? Convert.ToInt32(row["AllotmentRefused"])          : 0;
                    int a3 = HC("AllotmentLetterDownloaded") && row["AllotmentLetterDownloaded"] != DBNull.Value ? Convert.ToInt32(row["AllotmentLetterDownloaded"]) : 0;
                    int a4 = HC("Admitted")                  && row["Admitted"]                  != DBNull.Value ? Convert.ToInt32(row["Admitted"])                  : 0;
                    int a5 = HC("Rejected")                  && row["Rejected"]                  != DBNull.Value ? Convert.ToInt32(row["Rejected"])                  : 0;
                    int a6 = HC("Cancelled")                 && row["Cancelled"]                 != DBNull.Value ? Convert.ToInt32(row["Cancelled"])                 : 0;
                    t1+=a1; t2+=a2; t3+=a3; t4+=a4; t5+=a5; t6+=a6;
                    response.Rows.Add(new AllotmentReportByCourseRow
                    {
                        CourseName                = HC("CourseName") ? row["CourseName"]?.ToString() ?? "" : "",
                        Allotment=a1, AllotmentRefused=a2, AllotmentLetterDownloaded=a3,
                        Admitted=a4, Rejected=a5, Cancelled=a6,
                        PhaseID=phaseId, CollegeID=collegeId,
                    });
                }
                response.TotalAllotment=t1; response.TotalAllotmentRefused=t2;
                response.TotalAllotmentLetterDownloaded=t3; response.TotalAdmitted=t4;
                response.TotalRejected=t5; response.TotalCancelled=t6;
                response.Success = true;
            }
            catch (Exception ex) { response.Success = false; response.Message = ex.Message; }
            return response;
        }

        // ══════════════════════════════════════════════════════════════════════
        // GetCompositeAdmissionReportByCourse
        // SP: Report_GetCompositeAdmissionReportByCourse(@CollegeID)
        // SP: Report_GetCollegeName(@CollegeID)
        // Returns DataSet:
        //   Tables[0]: MaxActivePhaseID (int)
        //   Tables[1]: CourseName, CollegeID, Intake, AdmittedPhase1..10,
        //              TotalAdmitted, Vacancy
        // Mirrors: GetCompositeReport() in CompositeAdmissionReportByCourse.aspx.cs
        // ══════════════════════════════════════════════════════════════════════
        public CompositeAdmissionReportByCourseResponse GetCompositeAdmissionReportByCourse(long collegeId)
        {
            var response = new CompositeAdmissionReportByCourseResponse();
            try
            {
                if (collegeId <= 0)
                    return new CompositeAdmissionReportByCourseResponse { Success = false, Message = "Invalid CollegeID." };

                // Get college name
                try
                {
                    var np = new DynamicParameters();
                    np.Add("@CollegeID", collegeId);
                    response.CollegeName = _db.ExecuteScalar("Report_GetCollegeName", np)?.ToString() ?? "";
                }
                catch { response.CollegeName = ""; }

                var param = new DynamicParameters();
                param.Add("@CollegeID", collegeId);
                var ds = _db.GetDataSet("Report_GetCompositeAdmissionReportByCourse", param);

                if (ds == null || ds.Tables.Count < 2)
                { response.Success = true; return response; }

                // Tables[0] → MaxActivePhaseID
                if (ds.Tables[0].Rows.Count > 0 && ds.Tables[0].Columns.Contains("MaxActivePhaseID"))
                    response.MaxActivePhaseID = Convert.ToInt32(ds.Tables[0].Rows[0]["MaxActivePhaseID"]);

                // Tables[1] → data rows
                var dt = ds.Tables[1];
                if (dt.Rows.Count == 0) { response.Success = true; return response; }

                bool H(string n) => dt.Columns.Contains(n);
                int tI=0,t1=0,t2=0,t3=0,t4=0,t5=0,t6=0,t7=0,t8=0,t9=0,t10=0,tA=0,tV=0;

                foreach (System.Data.DataRow row in dt.Rows)
                {
                    int intake   = H("Intake")          && row["Intake"]          != DBNull.Value ? Convert.ToInt32(row["Intake"])          : 0;
                    int ap1      = H("AdmittedPhase1")  && row["AdmittedPhase1"]  != DBNull.Value ? Convert.ToInt32(row["AdmittedPhase1"])  : 0;
                    int ap2      = H("AdmittedPhase2")  && row["AdmittedPhase2"]  != DBNull.Value ? Convert.ToInt32(row["AdmittedPhase2"])  : 0;
                    int ap3      = H("AdmittedPhase3")  && row["AdmittedPhase3"]  != DBNull.Value ? Convert.ToInt32(row["AdmittedPhase3"])  : 0;
                    int ap4      = H("AdmittedPhase4")  && row["AdmittedPhase4"]  != DBNull.Value ? Convert.ToInt32(row["AdmittedPhase4"])  : 0;
                    int ap5      = H("AdmittedPhase5")  && row["AdmittedPhase5"]  != DBNull.Value ? Convert.ToInt32(row["AdmittedPhase5"])  : 0;
                    int ap6      = H("AdmittedPhase6")  && row["AdmittedPhase6"]  != DBNull.Value ? Convert.ToInt32(row["AdmittedPhase6"])  : 0;
                    int ap7      = H("AdmittedPhase7")  && row["AdmittedPhase7"]  != DBNull.Value ? Convert.ToInt32(row["AdmittedPhase7"])  : 0;
                    int ap8      = H("AdmittedPhase8")  && row["AdmittedPhase8"]  != DBNull.Value ? Convert.ToInt32(row["AdmittedPhase8"])  : 0;
                    int ap9      = H("AdmittedPhase9")  && row["AdmittedPhase9"]  != DBNull.Value ? Convert.ToInt32(row["AdmittedPhase9"])  : 0;
                    int ap10     = H("AdmittedPhase10") && row["AdmittedPhase10"] != DBNull.Value ? Convert.ToInt32(row["AdmittedPhase10"]) : 0;
                    int total    = H("TotalAdmitted")   && row["TotalAdmitted"]   != DBNull.Value ? Convert.ToInt32(row["TotalAdmitted"])   : 0;
                    int vacancy  = H("Vacancy")         && row["Vacancy"]         != DBNull.Value ? Convert.ToInt32(row["Vacancy"])         : 0;

                    tI+=intake; t1+=ap1; t2+=ap2; t3+=ap3; t4+=ap4; t5+=ap5;
                    t6+=ap6; t7+=ap7; t8+=ap8; t9+=ap9; t10+=ap10; tA+=total; tV+=vacancy;

                    response.Rows.Add(new CompositeAdmissionReportRow
                    {
                        CourseName     = H("CourseName") ? row["CourseName"]?.ToString() ?? "" : "",
                        CollegeID      = H("CollegeID")  && row["CollegeID"]  != DBNull.Value ? Convert.ToInt64(row["CollegeID"]) : collegeId,
                        Intake=intake, AdmittedPhase1=ap1, AdmittedPhase2=ap2,
                        AdmittedPhase3=ap3, AdmittedPhase4=ap4, AdmittedPhase5=ap5,
                        AdmittedPhase6=ap6, AdmittedPhase7=ap7, AdmittedPhase8=ap8,
                        AdmittedPhase9=ap9, AdmittedPhase10=ap10,
                        TotalAdmitted=total, Vacancy=vacancy,
                    });
                }
                response.TotalIntake=tI; response.TotalAdmittedPhase1=t1; response.TotalAdmittedPhase2=t2;
                response.TotalAdmittedPhase3=t3; response.TotalAdmittedPhase4=t4; response.TotalAdmittedPhase5=t5;
                response.TotalAdmittedPhase6=t6; response.TotalAdmittedPhase7=t7; response.TotalAdmittedPhase8=t8;
                response.TotalAdmittedPhase9=t9; response.TotalAdmittedPhase10=t10;
                response.TotalTotalAdmitted=tA; response.TotalVacancy=tV;
                response.Success = true;
            }
            catch (Exception ex) { response.Success = false; response.Message = ex.Message; }
            return response;
        }
        // ══════════════════════════════════════════════════════════════════════
        // GetCandidatesEligibleForCounselling
        // SP: Report_GetCandidatesEligibleForCounselling(@CourseID)
        // Uses user.CourseID from JWT — mirrors: new ReportWorker().GetCandidatesEligibleForCounselling(user.CourseID)
        // ══════════════════════════════════════════════════════════════════════
        public EligibleCandidatesResponse GetCandidatesEligibleForCounselling(int courseId)
        {
            var response = new EligibleCandidatesResponse();
            try
            {
                var param = new DynamicParameters();
                param.Add("@CourseID", courseId);
                var dt = _db.GetDataTable("Report_GetCandidatesEligibleForCounselling", param);
                if (dt == null || dt.Rows.Count == 0) { response.Success = true; return response; }

                bool H(string n) => dt.Columns.Contains(n);
                foreach (System.Data.DataRow row in dt.Rows)
                {
                    response.Rows.Add(new EligibleCandidateRow
                    {
                        AppliedCourse        = H("AppliedCourse")        ? row["AppliedCourse"]?.ToString()        ?? "" : "",
                        TotalWeightage       = H("TotalWeightage")       ? row["TotalWeightage"]?.ToString()       ?? "" : "",
                        ApplicationID        = H("ApplicationID")        ? row["ApplicationID"]?.ToString()        ?? "" : "",
                        CandidateName        = H("CandidateName")        ? row["CandidateName"]?.ToString()        ?? "" : "",
                        Gender               = H("Gender")               ? row["Gender"]?.ToString()               ?? "" : "",
                        DOB                  = H("DOB")                  ? row["DOB"]?.ToString()                  ?? "" : "",
                        FinalCategory        = H("FinalCategory")        ? row["FinalCategory"]?.ToString()        ?? "" : "",
                        DomicileDistrict     = H("DomicileDistrict")     ? row["DomicileDistrict"]?.ToString()     ?? "" : "",
                        MobileNo             = H("MobileNo")             ? row["MobileNo"]?.ToString()             ?? "" : "",
                        EMailID              = H("EMailID")              ? row["EMailID"]?.ToString()              ?? "" : "",
                        DocumentsDiscrepancy = H("DocumentsDiscrepancy") ? row["DocumentsDiscrepancy"]?.ToString() ?? "" : "",
                    });
                }
                response.Success = true;
            }
            catch (Exception ex) { response.Success = false; response.Message = ex.Message; }
            return response;
        }

        // ══════════════════════════════════════════════════════════════════════
        // GetAllotmentDetail — mirrors AllotmentReport.aspx.cs GetAllotmentReport()
        // SP: Report_GetAllotmentReport(@CollegeID, @PhaseID, @Flag)
        // Flags: Allotment | AllotmentRefused | AllotmentLetterDownloaded | Admitted | Rejected | Cancelled
        // ══════════════════════════════════════════════════════════════════════
        public AllotmentDetailResponse GetAllotmentDetail(long collegeId, int phaseId, string flag)
        {
            var r = new AllotmentDetailResponse();
            try
            {
                // Resolve college name
                try { var np = new DynamicParameters(); np.Add("@CollegeID", collegeId); r.CollegeName = _db.ExecuteScalar("Report_GetCollegeName", np)?.ToString() ?? ""; } catch { }
                try { var np = new DynamicParameters(); np.Add("@CollegeID", collegeId); r.CourseName  = _db.ExecuteScalar("Report_GetCourseName",   np)?.ToString() ?? ""; } catch { }

                // Human-readable flag label — mirrors ViewState["Flag"] in AllotmentReport.aspx.cs
                r.FlagLabel = flag switch
                {
                    "Allotment"                 => "",
                    "AllotmentRefused"          => "Allotment Refused",
                    "AllotmentLetterDownloaded" => "Allotment Letter Downloaded",
                    "Admitted"                  => "Admitted",
                    "Rejected"                  => "Rejected",
                    "Cancelled"                 => "Cancelled",
                    _                           => flag,
                };

                var p = new DynamicParameters();
                p.Add("@CollegeID", collegeId);
                p.Add("@PhaseID",   (short)phaseId);
                p.Add("@Flag",      flag);
                var dt = _db.GetDataTable("Report_GetAllotmentReport", p);
                if (dt == null || dt.Rows.Count == 0) { r.Success = true; return r; }

                bool HC(string n) => dt.Columns.Contains(n);
                foreach (System.Data.DataRow row in dt.Rows)
                {
                    r.Rows.Add(new AllotmentDetailRow
                    {
                        MeritNo           = HC("MeritNo")           ? row["MeritNo"]?.ToString()           ?? "" : "",
                        TotalWeightage    = HC("TotalWeightage")    ? row["TotalWeightage"]?.ToString()    ?? "" : "",
                        ApplicationID     = HC("ApplicationID")     ? row["ApplicationID"]?.ToString()     ?? "" : "",
                        CandidateName     = HC("CandidateName")     ? row["CandidateName"]?.ToString()     ?? "" : "",
                        MobileNo          = HC("MobileNo")          ? row["MobileNo"]?.ToString()          ?? "" : "",
                        AllottedTypeDisplay= HC("AllottedTypeDisplay")? row["AllottedTypeDisplay"]?.ToString()??"" : "",
                        CurrentStatus     = HC("CurrentStatus")     ? row["CurrentStatus"]?.ToString()     ?? "" : "",
                    });
                }
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }

        // ══════════════════════════════════════════════════════════════════════
        // GetCompositeDetail — mirrors CompositeAdmissionReport.aspx.cs GetCompositeReport()
        // SP: Report_GetCompositeAdmissionReport(@CollegeID, @PhaseID)
        // ══════════════════════════════════════════════════════════════════════
        public CompositeDetailResponse GetCompositeDetail(long collegeId, int phaseId)
        {
            var r = new CompositeDetailResponse();
            try
            {
                try { var np = new DynamicParameters(); np.Add("@CollegeID", collegeId); r.CollegeName = _db.ExecuteScalar("Report_GetCollegeName", np)?.ToString() ?? ""; } catch { }
                try { var np = new DynamicParameters(); np.Add("@CollegeID", collegeId); r.CourseName  = _db.ExecuteScalar("Report_GetCourseName",   np)?.ToString() ?? ""; } catch { }

                var p = new DynamicParameters();
                p.Add("@CollegeID", collegeId);
                p.Add("@PhaseID",   (short)phaseId);
                var dt = _db.GetDataTable("Report_GetCompositeAdmissionReport", p);
                if (dt == null || dt.Rows.Count == 0) { r.Success = true; return r; }

                bool HC(string n) => dt.Columns.Contains(n);
                foreach (System.Data.DataRow row in dt.Rows)
                {
                    r.Rows.Add(new CompositeDetailRow
                    {
                        TotalWeightage     = HC("TotalWeightage")     ? row["TotalWeightage"]?.ToString()     ?? "" : "",
                        ApplicationID      = HC("ApplicationID")      ? row["ApplicationID"]?.ToString()      ?? "" : "",
                        CandidateName      = HC("CandidateName")      ? row["CandidateName"]?.ToString()      ?? "" : "",
                        MobileNo           = HC("MobileNo")           ? row["MobileNo"]?.ToString()           ?? "" : "",
                        AllottedTypeDisplay= HC("AllottedTypeDisplay")? row["AllottedTypeDisplay"]?.ToString()??"" : "",
                    });
                }
                r.Success = true;
            }
            catch (Exception ex) { r.Success = false; r.Message = ex.Message; }
            return r;
        }
    }
}
