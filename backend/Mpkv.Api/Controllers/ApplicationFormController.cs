using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mpkv.Api.Models.Candidate;
using Mpkv.Api.Services;
using System.Security.Claims;

namespace Mpkv.Api.Controllers
{
    [ApiController]
    [Route("api/applicationform")]
    [Authorize]
    public class ApplicationFormController : ControllerBase
    {
        private readonly IApplicationFormService _appFormService;
        public ApplicationFormController(IApplicationFormService appFormService) => _appFormService = appFormService;

        private long   GetCandidateId()  { var c = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "0"; return long.TryParse(c, out var id) ? id : 0; }
        private string GetUserLoginId()  => User.FindFirstValue(ClaimTypes.Name) ?? "";
        private string GetIpAddress()    => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        [HttpGet("masters/personal")]  public IActionResult GetPersonalMasters()  => Ok(_appFormService.GetPersonalMasters());
        [HttpGet("masters/address")]   public IActionResult GetAddressMasters()   => Ok(_appFormService.GetAddressMasters());
        [HttpGet("masters/category")]  public IActionResult GetCategoryMasters()  => Ok(_appFormService.GetCategoryMasters());
        [HttpGet("masters/sports")]    public IActionResult GetSportsMasters()    => Ok(_appFormService.GetSportsMasters());
        [HttpGet("masters/qualification")] public IActionResult GetQualificationMasters() => Ok(_appFormService.GetQualificationMasters());

        [HttpGet("personal")]      public IActionResult GetPersonal()     { var c = GetCandidateId(); if (c<=0) return Unauthorized(); return Ok(_appFormService.GetPersonalDetails(c, GetUserLoginId())); }
        [HttpGet("address")]       public IActionResult GetAddress()      { var c = GetCandidateId(); if (c<=0) return Unauthorized(); return Ok(_appFormService.GetAddressDetails(c, GetUserLoginId())); }
        [HttpGet("category")]      public IActionResult GetCategory()     { var c = GetCandidateId(); if (c<=0) return Unauthorized(); return Ok(_appFormService.GetCategoryDetails(c, GetUserLoginId())); }
        [HttpGet("sports")]        public IActionResult GetSports()       { var c = GetCandidateId(); if (c<=0) return Unauthorized(); return Ok(_appFormService.GetSportsDetails(c, GetUserLoginId())); }
        [HttpGet("qualification")] public IActionResult GetQualification(){ var c = GetCandidateId(); if (c<=0) return Unauthorized(); return Ok(_appFormService.GetQualificationDetails(c, GetUserLoginId())); }
        [HttpGet("photo-sign")]    public IActionResult GetPhotoSign()    { var c = GetCandidateId(); if (c<=0) return Unauthorized(); return Ok(_appFormService.GetPhotoSignDetails(c, GetUserLoginId())); }
        [HttpGet("documents")]     public IActionResult GetDocuments()    { var c = GetCandidateId(); if (c<=0) return Unauthorized(); return Ok(_appFormService.GetDocumentsList(c, GetUserLoginId())); }
        [HttpGet("fee")]           public IActionResult GetFee()          { var c = GetCandidateId(); if (c<=0) return Unauthorized(); var r = _appFormService.GetFeeDetails(c, GetUserLoginId()); return r.Success ? Ok(r) : BadRequest(r); }

        [HttpGet("options/available")]  public IActionResult GetAvailableOptions()  { var c = GetCandidateId(); if (c<=0) return Unauthorized(); return Ok(_appFormService.GetAvailableOptions(c)); }
        [HttpGet("options/shortlisted")] public IActionResult GetShortlistedOptions(){ var c = GetCandidateId(); if (c<=0) return Unauthorized(); return Ok(_appFormService.GetShortlistedOptions(c)); }
        [HttpGet("options/preferenced")] public IActionResult GetPreferencedOptions(){ var c = GetCandidateId(); if (c<=0) return Unauthorized(); var r = _appFormService.GetPreferencedOptions(c); return Ok(r); }

        [HttpPost("personal")]     public IActionResult SavePersonal([FromBody] SavePersonalRequest req)      { if (req==null) return BadRequest(new SavePersonalResponse{Success=false,Message="Invalid."}); var c=GetCandidateId(); if (c<=0) return Unauthorized(); if (string.IsNullOrWhiteSpace(req.CandidateName)) return BadRequest(new SavePersonalResponse{Success=false,Message="Name required."}); if (string.IsNullOrWhiteSpace(req.EmailID)) return BadRequest(new SavePersonalResponse{Success=false,Message="Email required."}); var r=_appFormService.SavePersonalDetails(c,GetUserLoginId(),GetIpAddress(),req); return r.Success ? Ok(r) : BadRequest(r); }
        [HttpPost("address")]      public IActionResult SaveAddress([FromBody] SaveAddressRequest req)        { if (req==null) return BadRequest(new SaveAddressResponse{Success=false,Message="Invalid."}); var c=GetCandidateId(); if (c<=0) return Unauthorized(); var r=_appFormService.SaveAddressDetails(c,GetUserLoginId(),GetIpAddress(),req); return r.Success ? Ok(r) : BadRequest(r); }
        [HttpPost("category")]     public IActionResult SaveCategory([FromBody] SaveCategoryRequest req)      { if (req==null) return BadRequest(new SaveCategoryResponse{Success=false,Message="Invalid."}); var c=GetCandidateId(); if (c<=0) return Unauthorized(); var r=_appFormService.SaveCategoryDetails(c,GetUserLoginId(),GetIpAddress(),req); return r.Success ? Ok(r) : BadRequest(r); }
        [HttpPost("sports")]       public IActionResult SaveSports([FromBody] SaveSportsRequest req)          { if (req==null) return BadRequest(new SaveSportsResponse{Success=false,Message="Invalid."}); var c=GetCandidateId(); if (c<=0) return Unauthorized(); var r=_appFormService.SaveSportsDetails(c,GetUserLoginId(),GetIpAddress(),req); return r.Success ? Ok(r) : BadRequest(r); }
        [HttpPost("qualification")] public IActionResult SaveQualification([FromBody] SaveQualificationRequest req){ if (req==null) return BadRequest(new SaveQualificationResponse{Success=false,Message="Invalid."}); var c=GetCandidateId(); if (c<=0) return Unauthorized(); var r=_appFormService.SaveQualificationDetails(c,GetUserLoginId(),GetIpAddress(),req); return r.Success ? Ok(r) : BadRequest(r); }
        [HttpPost("photo-sign/save")] public IActionResult SavePhotoSign(){ var c=GetCandidateId(); if (c<=0) return Unauthorized(); var r=_appFormService.SavePhotoSign(c,GetUserLoginId(),GetIpAddress()); return r.Success ? Ok(r) : BadRequest(r); }
        [HttpPost("documents/save")] public IActionResult SaveDocuments() { var c=GetCandidateId(); if (c<=0) return Unauthorized(); var r=_appFormService.SaveDocuments(c,GetUserLoginId(),GetIpAddress()); return r.Success ? Ok(r) : BadRequest(r); }
        [HttpPost("options/add")]    public IActionResult AddOption([FromBody] AddOptionRequest req) { if (req==null||req.CollegeID<=0) return BadRequest(new OptionActionResponse{Success=false,Message="Invalid."}); var c=GetCandidateId(); if (c<=0) return Unauthorized(); var r=_appFormService.AddOption(c,GetUserLoginId(),GetIpAddress(),req.CollegeID); return r.Success ? Ok(r) : BadRequest(r); }
        [HttpDelete("options/remove/{collegeId}")] public IActionResult RemoveOption(long collegeId){ var c=GetCandidateId(); if (c<=0) return Unauthorized(); var r=_appFormService.RemoveOption(c,GetUserLoginId(),GetIpAddress(),collegeId); return r.Success ? Ok(r) : BadRequest(r); }
        [HttpPost("options/save")]   public IActionResult SaveShortlist()  { var c=GetCandidateId(); if (c<=0) return Unauthorized(); var r=_appFormService.SaveShortlist(c,GetUserLoginId(),GetIpAddress()); return r.Success ? Ok(r) : BadRequest(r); }
        [HttpPost("options/preferences")] public IActionResult SavePreferences([FromBody] SavePreferencesRequest req){ if (req==null) return BadRequest(new SavePreferencesResponse{Success=false,Message="Invalid."}); var c=GetCandidateId(); if (c<=0) return Unauthorized(); var r=_appFormService.SavePreferences(c,GetUserLoginId(),GetIpAddress(),req); return r.Success ? Ok(r) : BadRequest(r); }
        [HttpPost("options/preferences/reset")] public IActionResult ResetPreferences(){ var c=GetCandidateId(); if (c<=0) return Unauthorized(); var r=_appFormService.ResetPreferences(c,GetUserLoginId(),GetIpAddress()); return r.Success ? Ok(r) : BadRequest(r); }

        [HttpPost("fee/initiate")]
        public IActionResult InitiateFee([FromBody] FeeInitiateRequest request) { var c=GetCandidateId(); if (c<=0) return Unauthorized(); if (request==null||request.PaymentGatewayID<=0) return BadRequest(new FeeInitiateResponse{Success=false,Message="Please select a payment gateway."}); var r=_appFormService.InitiateFeeTransaction(c,GetUserLoginId(),GetIpAddress(),request.PaymentGatewayID); return r.Success ? Ok(r) : BadRequest(r); }

        [HttpPost("fee/proceed")]
        public IActionResult ProceedFee() { var c=GetCandidateId(); if (c<=0) return Unauthorized(); var r=_appFormService.SaveFeeDetails(c,GetUserLoginId(),GetIpAddress()); return r.Success ? Ok(r) : BadRequest(r); }

        // ── Summary & Lock ────────────────────────────────────────────────────
        // GET  /api/applicationform/summary  → mirrors GetApplicationFormSummary()
        // POST /api/applicationform/summary/lock → mirrors LockApplicationForm()
        [HttpGet("summary")]
        public IActionResult GetSummary()
        {
            var c = GetCandidateId();
            if (c <= 0) return Unauthorized();
            var r = _appFormService.GetApplicationFormSummary(c, GetUserLoginId());
            return r.Success ? Ok(r) : BadRequest(r);
        }

        [HttpPost("summary/lock")]
        public IActionResult LockForm()
        {
            var c = GetCandidateId();
            if (c <= 0) return Unauthorized();
            var r = _appFormService.LockApplicationForm(c, GetUserLoginId(), GetIpAddress());
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // GET  /api/applicationform/unlock/eligibility
        // POST /api/applicationform/unlock
        [HttpGet("unlock/eligibility")]
        public IActionResult GetUnlockEligibility()
        {
            var c = GetCandidateId();
            if (c <= 0) return Unauthorized();
            var r = _appFormService.GetUnlockEligibility(c, GetUserLoginId());
            return Ok(r);
        }

        [HttpPost("unlock")]
        public IActionResult UnlockForm()
        {
            var c = GetCandidateId();
            if (c <= 0) return Unauthorized();
            var r = _appFormService.UnlockApplicationForm(c, GetUserLoginId(), GetIpAddress());
            return r.Success ? Ok(r) : BadRequest(r);
        }

        [HttpPost("upload-photo")]
        [RequestSizeLimit(200*1024)]
        public async Task<IActionResult> UploadPhoto([FromForm] IFormFile file) { if (file==null||file.Length==0) return BadRequest(new UploadPhotoSignResponse{Success=false,Message="Please Select Photograph to Upload."}); var c=GetCandidateId(); if (c<=0) return Unauthorized(); var r=await _appFormService.UploadPhoto(c,GetUserLoginId(),GetIpAddress(),file); return r.Success ? Ok(r) : BadRequest(r); }

        [HttpPost("upload-sign")]
        [RequestSizeLimit(100*1024)]
        public async Task<IActionResult> UploadSign([FromForm] IFormFile file) { if (file==null||file.Length==0) return BadRequest(new UploadPhotoSignResponse{Success=false,Message="Please Select Signature to Upload."}); var c=GetCandidateId(); if (c<=0) return Unauthorized(); var r=await _appFormService.UploadSign(c,GetUserLoginId(),GetIpAddress(),file); return r.Success ? Ok(r) : BadRequest(r); }

        [HttpPost("documents/upload")]
        [RequestSizeLimit(10*1024*1024)]
        public async Task<IActionResult> UploadDocument([FromForm] int documentId, [FromForm] string? documentNo, [FromForm] string? documentIssueDate, [FromForm] IFormFile? file) { if (file==null||file.Length==0) return BadRequest(new UploadDocumentResponse{Success=false,Message="Please select a file to upload."}); var c=GetCandidateId(); if (c<=0) return Unauthorized(); var req=new UploadDocumentRequest{DocumentID=documentId,DocumentNo=documentNo??"",DocumentIssueDate=documentIssueDate??""}; var r=await _appFormService.UploadDocument(c,GetUserLoginId(),GetIpAddress(),req,file); return r.Success ? Ok(r) : BadRequest(r); }

        [HttpDelete("documents/delete/{documentId}")]
        public IActionResult DeleteDocument(int documentId) { var c=GetCandidateId(); if (c<=0) return Unauthorized(); var r=_appFormService.DeleteDocument(c,GetUserLoginId(),GetIpAddress(),documentId); return r.Success ? Ok(r) : BadRequest(r); }
    }
}
