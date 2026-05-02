using NexDesk.Domain.Entities;
using NexDesk.Domain.IServices;
using NexDesk.Infrastructure;

namespace NexDesk.Infrastructure.Services
{
    public class NotificationService : INotificationService
    {
        private readonly NexDeskDbContext _db;

        public NotificationService(NexDeskDbContext db)
        {
            _db = db;
        }

        public async Task CreateAsync(int userId, string type, string message, int? ticketId = null)
        {
            var notification = new Notification
            {
                UserId = userId,
                TicketId = ticketId,
                Type = type,
                Message = message,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync();
        }

        public async Task NotifyTicketCreatedAsync(int userId, int ticketId, string ticketTitle)
        {
            await CreateAsync(
                userId,
                "TicketCreated",
                $"Ticket #{ticketId} was created: {ticketTitle}",
                ticketId
            );
        }

        public async Task NotifyTicketAssignedAsync(int userId, int ticketId, string ticketTitle)
        {
            await CreateAsync(
                userId,
                "Assignment",
                $"You have been assigned to ticket #{ticketId}: {ticketTitle}",
                ticketId
            );
        }

        public async Task NotifyTicketUpdatedAsync(int userId, int ticketId, string ticketTitle)
        {
            await CreateAsync(
                userId,
                "Update",
                $"Ticket #{ticketId} has been updated: {ticketTitle}",
                ticketId
            );
        }

        public async Task NotifyTicketClosedAsync(int userId, int ticketId, string ticketTitle)
        {
            await CreateAsync(
                userId,
                "Resolved",
                $"Ticket #{ticketId} has been closed: {ticketTitle}",
                ticketId
            );
        }

        public async Task NotifyTaskCreatedAsync(int userId, int ticketId, string taskTitle)
        {
            await CreateAsync(
                userId,
                "TaskCreated",
                $"A task was created for ticket #{ticketId}: {taskTitle}",
                ticketId
            );
        }

        public async Task NotifyCommentAddedAsync(int userId, int ticketId, string ticketTitle)
        {
            await CreateAsync(
                userId,
                "CommentAdded",
                $"A new comment was added to ticket #{ticketId}: {ticketTitle}",
                ticketId
            );
        }
    }
}            