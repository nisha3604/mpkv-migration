using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Models.Candidate;
using Mpkv.Api.Services;

namespace Mpkv.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HomeController : ControllerBase
    {
        private readonly IHomeService _homeService;
        public HomeController(IHomeService homeService) => _homeService = homeService;

        [HttpGet]
        public IActionResult GetHomeData([FromQuery] short regionId = 1)
            => Ok(_homeService.GetHomePageData(regionId));

        [HttpGet("search-college/masters")]
        public IActionResult GetSearchCollegeMasters()
            => Ok(_homeService.GetSearchCollegeMasters());

        [HttpPost("search-college")]
        public IActionResult SearchCollege([FromBody] SearchCollegeRequest req)
        {
            if (req == null) return BadRequest(new SearchCollegeResponse { Message = "Invalid request." });
            var result = _homeService.SearchCollege(req.CourseID, req.DistrictID, req.CourseStatusID);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("allotment-list/masters")]
        public IActionResult GetAllotmentListMasters()
            => Ok(_homeService.GetAllotmentListMasters());

        [HttpPost("allotment-list/colleges")]
        public IActionResult GetAllotmentColleges([FromBody] int courseId)
            => Ok(_homeService.GetAllotmentColleges((short)courseId));

        [HttpPost("allotment-list")]
        public IActionResult GetAllotmentList([FromBody] AllotmentListRequest req)
        {
            if (req == null || req.CollegeID <= 0 || req.PhaseID <= 0)
                return BadRequest(new AllotmentListResponse { Message = "Please select Round, Course and College." });
            var result = _homeService.GetAllotmentList(req.CollegeID, req.PhaseID);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
