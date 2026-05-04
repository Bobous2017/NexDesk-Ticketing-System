using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexDesk.Domain.Dtos.AttachmentDto;
using NexDesk.Domain.Entities;
using NexDesk.Infrastructure;

namespace NexDesk.API.Controllers.Crud
{
    [ApiController]
    [Route("api/attachments")]
    public class AttachmentsController : ControllerBase
    {
        private readonly NexDeskDbContext _db;
        private readonly IWebHostEnvironment _env;
        private readonly IConfiguration _config;

        public AttachmentsController(NexDeskDbContext db, IWebHostEnvironment env, IConfiguration config)
        {
            _db = db;
            _env = env;
            _config = config;
        }

        // GET api/attachments/ticket/{ticketId}
        [HttpGet("ticket/{ticketId:int}")]
        public async Task<IActionResult> GetByTicket(int ticketId)
        {
            var apiBase = _config["Api:PublicUrl"] ?? _config["Api:BaseUrl"] ?? "";
            var items = await _db.Attachments
                .Include(x => x.UploadedByUser)
                .Where(x => x.TicketId == ticketId)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new AttachmentDto
                {
                    Id = x.Id,
                    TicketId = x.TicketId,
                    ReportId = x.ReportId,
                    UploadedByUserId = x.UploadedByUserId,
                    FileName = x.FileName,
                    FilePath = x.FilePath,
                    FileType = x.FileType,
                    CreatedAt = x.CreatedAt,
                    UploadedByUserName = x.UploadedByUser != null
                        ? ((x.UploadedByUser.FirstName ?? "") + " " + (x.UploadedByUser.LastName ?? "")).Trim()
                        : "Unknown",
                    DownloadUrl = $"{apiBase}{x.FilePath}"
                })
                .ToListAsync();
            return Ok(items);
        }

        // POST api/attachments/upload
        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] int ticketId, [FromForm] int uploadedByUserId, [FromForm] int? reportId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file provided.");

            var ticketExists = await _db.TicketTask.AnyAsync(x => x.Id == ticketId);
            if (!ticketExists) return BadRequest("Invalid ticketId.");

            // Save file to wwwroot/uploads/tickets/
            var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "tickets");
            Directory.CreateDirectory(uploadsFolder);

            // Unique filename to avoid collisions
            var extension = Path.GetExtension(file.FileName);
            var uniqueName = $"{Guid.NewGuid()}{extension}";
            var fullPath = Path.Combine(uploadsFolder, uniqueName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var filePath = $"/uploads/tickets/{uniqueName}";

            var attachment = new Attachment
            {
                TicketId = ticketId,
                ReportId = reportId,
                UploadedByUserId = uploadedByUserId,
                FileName = file.FileName, // original name for display
                FilePath = filePath,
                FileType = file.ContentType,
                CreatedAt = DateTime.UtcNow
            };

            _db.Attachments.Add(attachment);
            await _db.SaveChangesAsync();

            var apiBase = _config["Api:PublicUrl"] ?? _config["Api:BaseUrl"] ?? "";
            return Ok(new AttachmentDto
            {
                Id = attachment.Id,
                TicketId = attachment.TicketId,
                ReportId = attachment.ReportId,
                UploadedByUserId = attachment.UploadedByUserId,
                FileName = attachment.FileName,
                FilePath = attachment.FilePath,
                FileType = attachment.FileType,
                CreatedAt = attachment.CreatedAt,
                DownloadUrl = $"{apiBase}{filePath}"
            });
        }

        // GET api/attachments/{id}/download
        [HttpGet("{id:int}/download")]
        public async Task<IActionResult> Download(int id)
        {
            var attachment = await _db.Attachments.FirstOrDefaultAsync(x => x.Id == id);
            if (attachment == null) return NotFound("Attachment not found.");

            var fullPath = Path.Combine(_env.WebRootPath, attachment.FilePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (!System.IO.File.Exists(fullPath))
                return NotFound("File not found on server.");

            var fileBytes = await System.IO.File.ReadAllBytesAsync(fullPath);
            return File(fileBytes, attachment.FileType, attachment.FileName);
        }

        // DELETE api/attachments/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var attachment = await _db.Attachments.FirstOrDefaultAsync(x => x.Id == id);
            if (attachment == null) return NotFound();

            // Delete physical file
            var fullPath = Path.Combine(_env.WebRootPath, attachment.FilePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (System.IO.File.Exists(fullPath))
                System.IO.File.Delete(fullPath);

            _db.Attachments.Remove(attachment);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Attachment deleted." });
        }
    }
}