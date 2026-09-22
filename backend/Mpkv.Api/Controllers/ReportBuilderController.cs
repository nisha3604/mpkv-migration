using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Helpers;
using Mpkv.Api.Models.Admin;
using Mpkv.Api.Services;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    [ApiController]
    [Route("api/admin/reports")]
    [Authorize]
    public class ReportBuilderController : ControllerBase
    {
        private readonly IReportBuilderService _svc;
        private const short REGION_ID = 1;

        public ReportBuilderController(IReportBuilderService svc) => _svc = svc;

        private int    GetUserTypeId() => int.TryParse(User.FindFirstValue("UserTypeID") ?? "0", out var v) ? v : 0;
        private string GetLoginId()    => User.FindFirstValue(ClaimTypes.Name) ?? "";
        private string GetIp()         => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        private bool   IsAdmin()       => UserTypeHelper.IsAdmin(GetUserTypeId());

        // GET /api/admin/reports
        [HttpGet]
        public IActionResult GetList()
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetList(REGION_ID));
        }

        // GET /api/admin/reports/{id}
        [HttpGet("{id:int}")]
        public IActionResult GetReport(int id)
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetReport(id));
        }

        // POST /api/admin/reports
        [HttpPost]
        public IActionResult Save([FromBody] SaveReportRequest req)
        {
            if (!IsAdmin()) return Forbid();
            if (req == null) return BadRequest(new SaveReportResponse { Success = false, Message = "Invalid request." });
            var r = _svc.Save(req.ReportID, req.ReportName, req.ReportQuery, REGION_ID, GetLoginId(), GetIp());
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // DELETE /api/admin/reports/{id}
        [HttpDelete("{id:int}")]
        public IActionResult Delete(int id)
        {
            if (!IsAdmin()) return Forbid();
            var r = _svc.Delete(id, GetLoginId(), GetIp());
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // POST /api/admin/reports/{id}/execute
        [HttpPost("{id:int}/execute")]
        public IActionResult Execute(int id)
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.Execute(id));
        }

        // GET /api/admin/reports/table-views
        [HttpGet("table-views")]
        public IActionResult GetTableViews()
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetTableViewList());
        }

        // GET /api/admin/reports/columns?tableView=X
        [HttpGet("columns")]
        public IActionResult GetColumns([FromQuery] string tableView)
        {
            if (!IsAdmin()) return Forbid();
            if (string.IsNullOrWhiteSpace(tableView))
                return Ok(new ColumnListResponse { Success = true });
            return Ok(_svc.GetColumnList(tableView));
        }

        // GET /api/admin/reports/list — ReportsList.aspx: clickable report list
        [HttpGet("list")]
        public IActionResult GetReportsList()
        {
            if (!IsAdmin()) return Forbid();
            return Ok(_svc.GetReportsList());
        }

        // GET /api/admin/reports/{id}/generate — GenerateReport.aspx
        [HttpGet("{id:int}/generate")]
        public IActionResult GenerateReport(int id)
        {
            if (!IsAdmin()) return Forbid();
            var r = _svc.GenerateReport(id);
            return r.Success ? Ok(r) : BadRequest(r);
        }
    }
}
