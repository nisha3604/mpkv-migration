using Microsoft.AspNetCore.Mvc;
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
    }
}
