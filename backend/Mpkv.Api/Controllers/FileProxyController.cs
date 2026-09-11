using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mpkv.Api.Controllers
{
    /// <summary>
    /// Proxies Azure Blob files back to the browser with Content-Disposition: inline
    /// so PDFs render inside an iframe instead of triggering a download.
    ///
    /// Uses BlobServiceClient (authenticated via connection string) so private
    /// containers are accessible — a plain HttpClient would get 403 on private blobs.
    ///
    /// GET /api/file/preview?url={encodedBlobUrl}
    /// </summary>
    [ApiController]
    [Route("api/file")]
    public class FileProxyController : ControllerBase
    {
        private readonly IConfiguration _config;

        public FileProxyController(IConfiguration config)
            => _config = config;

        [HttpGet("preview")]
        [AllowAnonymous]  // iframe cannot send Bearer token
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
                var connStr   = _config["AzureBlob:StorageConnectionString"] ?? "";
                var storageUrl = _config["AzureBlob:StorageURL"]?.TrimEnd('/') ?? "";

                // Parse container name and blob path from the URL
                // URL format: https://<account>.blob.core.windows.net/<container>/<blobPath>
                var pathParts     = uri.AbsolutePath.TrimStart('/').Split('/', 2);
                var containerName = pathParts.Length > 0 ? pathParts[0] : "";
                var blobName      = pathParts.Length > 1 ? pathParts[1] : "";

                if (string.IsNullOrWhiteSpace(containerName) || string.IsNullOrWhiteSpace(blobName))
                    return BadRequest("Could not parse container or blob name from URL.");

                byte[]  bytes;
                string  contentType;

                if (!string.IsNullOrWhiteSpace(connStr) &&
                    connStr.Contains("AccountKey=") &&
                    !connStr.Contains("REPLACE_WITH"))
                {
                    // ── Authenticated download via SDK (works for private containers) ──
                    var blobServiceClient    = new BlobServiceClient(connStr);
                    var containerClient      = blobServiceClient.GetBlobContainerClient(containerName);
                    var blobClient           = containerClient.GetBlobClient(blobName);

                    using var ms = new MemoryStream();
                    await blobClient.DownloadToAsync(ms);
                    bytes = ms.ToArray();

                    // Detect content type from blob properties or fall back to extension
                    var props = await blobClient.GetPropertiesAsync();
                    contentType = props.Value.ContentType ?? "";
                }
                else
                {
                    // ── Fallback: public blob — plain HTTP GET ──────────────────────
                    using var httpClient = new HttpClient();
                    var response = await httpClient.GetAsync(url);
                    if (!response.IsSuccessStatusCode)
                        return StatusCode((int)response.StatusCode, "Failed to fetch file.");

                    bytes       = await response.Content.ReadAsByteArrayAsync();
                    contentType = response.Content.Headers.ContentType?.ToString() ?? "";
                }

                // Normalise content type — always serve PDFs as application/pdf
                // (Azure often stores them as application/octet-stream which triggers download)
                var lowerUrl = url.ToLowerInvariant();
                if (string.IsNullOrWhiteSpace(contentType) ||
                    contentType.Contains("octet-stream") ||
                    lowerUrl.EndsWith(".pdf"))
                {
                    contentType = "application/pdf";
                }

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
