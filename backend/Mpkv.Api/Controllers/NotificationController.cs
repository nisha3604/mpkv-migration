using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.Admin;
using Mpkv.Api.Services;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    [ApiController]
    [Route("api/admin/notifications")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _svc;
        private const short REGION_ID = 1;

        public NotificationController(INotificationService svc) => _svc = svc;

        private int    GetUserTypeId() => int.TryParse(User.FindFirstValue("UserTypeID") ?? "0", out var v) ? v : 0;
        private string GetLoginId()    => User.FindFirstValue(ClaimTypes.Name) ?? "";
        private string GetIp()         => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        private bool   IsAdmin()       => UserTypeHelper.IsAdmin(GetUserTypeId());

        // GET /api/admin/notifications
        [HttpGet]
        public IActionResult GetList()
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetList(REGION_ID));
        }

        // GET /api/admin/notifications/categories
        [HttpGet("categories")]
        public IActionResult GetCategories()
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetCategories());
        }

        // GET /api/admin/notifications/{id}
        [HttpGet("{id:int}")]
        public IActionResult GetDetails(int id)
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetDetails(id));
        }

        // POST /api/admin/notifications
        [HttpPost]
        public IActionResult Save([FromBody] SaveNotificationRequest req)
        {
            if (!IsAdmin()) return Forbid();
            if (req == null) return BadRequest(new SaveNotificationResponse { Success=false, Message="Invalid request." });
            var r = _svc.Save(REGION_ID, req, GetLoginId(), GetIp());
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // DELETE /api/admin/notifications/{id}
        [HttpDelete("{id:int}")]
        public IActionResult Delete(int id)
        {
            if (!IsAdmin()) return Forbid();
            var r = _svc.Delete(id, GetLoginId(), GetIp());
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // POST /api/admin/notifications/upload-file
        [HttpPost("upload-file")]
        [RequestSizeLimit(5 * 1024 * 1024)]
        public async Task<IActionResult> UploadFile([FromForm] IFormFile file, [FromForm] int categoryId = 1)
        {
            if (!IsAdmin()) return Forbid();
            if (file == null || file.Length == 0)
                return BadRequest(new { success=false, message="Please select a file." });
            var url = await _svc.UploadFile(file, categoryId);
            if (string.IsNullOrEmpty(url))
                return BadRequest(new { success=false, message="Upload failed." });
            return Ok(new { success=true, url, fileName=file.FileName });
        }
    }
}
