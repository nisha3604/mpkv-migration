using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.College;
using Mpkv.Api.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize]
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;
        public ReportController(IReportService reportService) => _reportService = reportService;

        private long   GetUserId()     => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? "0");
        private int    GetUserTypeId() => int.Parse(User.FindFirstValue("UserTypeID") ?? "0");
        private string GetLoginId()    => User.FindFirstValue(ClaimTypes.Name) ?? "";
        private int    GetCourseId()   => int.Parse(User.FindFirstValue("CourseID") ?? "0");

        private long ResolveCollegeId(long? qsCollegeId = null)
            => UserTypeHelper.IsCollege(GetUserTypeId()) ? GetUserId() : (qsCollegeId ?? GetUserId());

        // GET /api/reports/phases
        [HttpGet("phases")]
        public IActionResult GetPhases()
            => Ok(_reportService.GetPhases(GetUserTypeId(), GetLoginId()));

        // GET /api/reports/allotment-by-course?phaseId=X&collegeId=Y
        [HttpGet("allotment-by-course")]
        public IActionResult GetAllotmentByCourse([FromQuery] int phaseId, [FromQuery] long? collegeId = null)
        {
            if (phaseId <= 0) return Ok(new { success = false, message = "Please Select Round." });
            return Ok(_reportService.GetAllotmentReportByCourse(ResolveCollegeId(collegeId), phaseId));
        }

        // GET /api/reports/composite-by-course?collegeId=Y
        [HttpGet("composite-by-course")]
        public IActionResult GetCompositeByCourse([FromQuery] long? collegeId = null)
            => Ok(_reportService.GetCompositeAdmissionReportByCourse(ResolveCollegeId(collegeId)));

        // GET /api/reports/eligible-for-counselling
        // Mirrors: CandidatesEligibleForCounselling.aspx
        // CourseID from JWT — no filter
        // Access: UserTypeID 11, 12, 61 only
        [HttpGet("eligible-for-counselling")]
        public IActionResult GetEligibleForCounselling()
        {
            var typeId = GetUserTypeId();
            if (typeId != 11 && typeId != 12 && typeId != 61) return Forbid();
            return Ok(_reportService.GetCandidatesEligibleForCounselling(GetCourseId()));
        }

        // GET /api/reports/allotment-detail?phaseId=X&collegeId=Y&flag=Z
        // Mirrors AllotmentReport.aspx — drill-down from AllotmentReportByCourse
        [HttpGet("allotment-detail")]
        public IActionResult GetAllotmentDetail([FromQuery] int phaseId, [FromQuery] long? collegeId = null, [FromQuery] string flag = "Allotment")
        {
            if (phaseId <= 0) return Ok(new AllotmentDetailResponse { Success = false, Message = "Invalid PhaseID." });
            return Ok(_reportService.GetAllotmentDetail(ResolveCollegeId(collegeId), phaseId, flag));
        }

        // GET /api/reports/composite-detail?phaseId=X&collegeId=Y
        // Mirrors CompositeAdmissionReport.aspx — drill-down from CompositeAdmissionReportByCourse
        [HttpGet("composite-detail")]
        public IActionResult GetCompositeDetail([FromQuery] int phaseId, [FromQuery] long? collegeId = null)
        {
            return Ok(_reportService.GetCompositeDetail(ResolveCollegeId(collegeId), phaseId));
        }
    }
}
