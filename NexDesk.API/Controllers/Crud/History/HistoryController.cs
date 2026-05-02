    using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexDesk.Domain.Dtos.HistoryDto;
using NexDesk.Infrastructure;

namespace NexDesk.API.Controllers.Crud.History
{
    [ApiController]
    [Route("api/history")]
    public class HistoryController : ControllerBase
    {
        private readonly NexDeskDbContext _db;

        public HistoryController(NexDeskDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _db.HistoryEntries
                .Include(x => x.ChangedByUser)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new HistoryDto
                {
                    Id = x.Id,
                    TicketId = x.TicketId,
                    ChangedByUserId = x.ChangedByUserId,
                    ActionType = x.ActionType,
                    OldValue = x.OldValue,
                    NewValue = x.NewValue,
                    CreatedAt = x.CreatedAt,
                    ChangedByUserName = x.ChangedByUser != null
                        ? ((x.ChangedByUser.FirstName ?? "") + " " + (x.ChangedByUser.LastName ?? "")).Trim()
                        : "Unknown"
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateHistoryEntryDto dto)
        {
            if (dto == null)
                return BadRequest("History data is required.");

            if (dto.TicketId <= 0)
                return BadRequest("Invalid TicketId.");

            if (dto.ChangedByUserId <= 0)
                return BadRequest("Invalid ChangedByUserId.");

            if (string.IsNullOrWhiteSpace(dto.ActionType))
                return BadRequest("ActionType is required.");

            var ticketExists = await _db.TicketTask.AnyAsync(x => x.Id == dto.TicketId);
            if (!ticketExists)
                return BadRequest("Invalid TicketId.");

            var userExists = await _db.Users.AnyAsync(x => x.Id == dto.ChangedByUserId);
            if (!userExists)
                return BadRequest("Invalid ChangedByUserId.");

            var entity = new Domain.Entities.HistoryEntry
            {
                TicketId = dto.TicketId,
                ChangedByUserId = dto.ChangedByUserId,
                ActionType = dto.ActionType.Trim(),
                OldValue = dto.OldValue,
                NewValue = dto.NewValue,
                CreatedAt = DateTime.UtcNow
            };

            _db.HistoryEntries.Add(entity);
            await _db.SaveChangesAsync();

            var created = await _db.HistoryEntries
                .Include(x => x.ChangedByUser)
                .Where(x => x.Id == entity.Id)
                .Select(x => new HistoryDto
                {
                    Id = x.Id,
                    TicketId = x.TicketId,
                    ChangedByUserId = x.ChangedByUserId,
                    ActionType = x.ActionType,
                    OldValue = x.OldValue,
                    NewValue = x.NewValue,
                    CreatedAt = x.CreatedAt,
                    ChangedByUserName = x.ChangedByUser != null
                        ? ((x.ChangedByUser.FirstName ?? "") + " " + (x.ChangedByUser.LastName ?? "")).Trim()
                        : "Unknown"
                })
                .FirstAsync();

            return Ok(created);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid history id.");

            var entry = await _db.HistoryEntries.FirstOrDefaultAsync(x => x.Id == id);
            if (entry == null)
                return NotFound();

            _db.HistoryEntries.Remove(entry);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }

}
