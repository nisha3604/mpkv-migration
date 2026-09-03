using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mpkv.Api.Controllers
{
    /// <summary>
    /// Proxies Azure Blob files back to the browser with Content-Disposition: inline
    /// so PDFs render inside an iframe instead of triggering a download.
    ///
    /// GET /api/file/preview?url={encodedBlobUrl}
    /// </summary>
    [ApiController]
    [Route("api/file")]
    public class FileProxyController : ControllerBase  // No [Authorize] — iframe cannot send Bearer token
    {
        private readonly IHttpClientFactory _httpFactory;

        public FileProxyController(IHttpClientFactory httpFactory)
            => _httpFactory = httpFactory;

        [HttpGet("preview")]
        [AllowAnonymous]  // iframe cannot send Bearer token — Azure domain check is the security guard
        public async Task<IActionResult> Preview([FromQuery] string url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return BadRequest("url is required.");

            // Only allow proxying to trusted Azure Blob Storage domain
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
                !uri.Host.EndsWith(".blob.core.windows.net", StringComparison.OrdinalIgnoreCase))
                return BadRequest("Only Azure Blob Storage URLs are supported.");

            try
            {
                var client   = _httpFactory.CreateClient();
                var response = await client.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                    return StatusCode((int)response.StatusCode, "Failed to fetch file.");

                var bytes       = await response.Content.ReadAsByteArrayAsync();

                // Always use application/pdf for PDFs — octet-stream forces download
                var contentType = "application/pdf";
                var rawType     = response.Content.Headers.ContentType?.ToString() ?? "";
                if (!rawType.Contains("pdf") && !url.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                    contentType = rawType.Length > 0 ? rawType : "application/octet-stream";

                // Force inline display — prevents browser download prompt
                Response.Headers["Content-Disposition"] = "inline; filename=\"document.pdf\"";
                Response.Headers["Cache-Control"]       = "private, max-age=300";

                return File(bytes, contentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Proxy error: {ex.Message}");
            }
        }
    }
}
