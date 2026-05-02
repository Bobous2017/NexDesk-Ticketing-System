using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexDesk.API.Controllers.Common;
using NexDesk.Domain.Dtos.Notifications;
using NexDesk.Domain.Entities;
using NexDesk.Infrastructure;

namespace NexDesk.API.Controllers.Crud.Notifications
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationsController : CrudControllerAPI<Notification>
    {
        public NotificationsController(NexDeskDbContext db) : base(db) { }

        // GET api/notifications — override to include User and Ticket
        [HttpGet]
        public override async Task<IActionResult> GetAll()
        {
            var items = await _db.Notifications
                .Include(x => x.User)
                .Include(x => x.Ticket)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new NotificationDto
                {
                    Id = x.Id,
                    UserId = x.UserId,
                    TicketId = x.TicketId,
                    Type = x.Type,
                    Message = x.Message,
                    IsRead = x.IsRead,
                    CreatedAt = x.CreatedAt,
                    UserName = x.User != null
                        ? ((x.User.FirstName ?? "") + " " + (x.User.LastName ?? "")).Trim()
                        : "Unknown",
                    TicketTitle = x.Ticket != null ? x.Ticket.Title : ""
                })
                .ToListAsync();
            return Ok(items);
        }

        // PATCH api/notifications/5/mark-as-read
        [HttpPatch("{id:int}/mark-as-read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _db.Notifications.FindAsync(id);
            if (notification == null) return NotFound();
            notification.IsRead = true;
            await _db.SaveChangesAsync();
            return Ok();
        }

        // PATCH api/notifications/mark-all-as-read
        [HttpPatch("mark-all-as-read/{userId:int}")]
        public async Task<IActionResult> MarkAllAsRead(int userId)
        {
            var unread = await _db.Notifications
                .Where(x => x.UserId == userId && !x.IsRead)
                .ToListAsync();

            unread.ForEach(x => x.IsRead = true);
            await _db.SaveChangesAsync();
            return Ok();
        }
    }
}