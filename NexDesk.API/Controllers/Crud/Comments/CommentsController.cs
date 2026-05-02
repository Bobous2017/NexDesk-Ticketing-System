using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexDesk.API.Controllers.Common;
using NexDesk.Domain.Dtos.CommentDto;
using NexDesk.Domain.Entities;
using NexDesk.Infrastructure;

namespace NexDesk.API.Controllers.Crud.Comments
{
    [ApiController]
    [Route("api/comments")]
    public class CommentsController : CrudControllerAPI<Comment>
    {
        public CommentsController(NexDeskDbContext db) : base(db) { }

        // GET api/comments — override to include User
        [HttpGet]
        public override async Task<IActionResult> GetAll()
        {
            var items = await _db.Comments
                .Include(x => x.User)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new CommentDto
                {
                    Id = x.Id,
                    TicketId = x.TicketId,
                    UserId = x.UserId,
                    CommentText = x.CommentText,
                    CreatedAt = x.CreatedAt,
                    UserName = x.User != null
                        ? ((x.User.FirstName ?? "") + " " + (x.User.LastName ?? "")).Trim()
                        : "Unknown"
                })
                .ToListAsync();
            return Ok(items);
        }

        // POST api/comments
        [HttpPost]
        public override async Task<IActionResult> Create([FromBody] Comment entity)
        {
            if (string.IsNullOrWhiteSpace(entity.CommentText))
                return BadRequest("Comment text is required.");
            entity.CreatedAt = DateTime.UtcNow;
            _db.Comments.Add(entity);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
        }

        
    }
}