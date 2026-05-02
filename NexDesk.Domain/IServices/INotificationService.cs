using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.IServices
{
    public interface INotificationService
    {
        Task CreateAsync(int userId, string type, string message, int? ticketId = null);

        Task NotifyTicketCreatedAsync(int userId, int ticketId, string ticketTitle);
        Task NotifyTicketAssignedAsync(int userId, int ticketId, string ticketTitle);
        Task NotifyTicketUpdatedAsync(int userId, int ticketId, string ticketTitle);
        Task NotifyTicketClosedAsync(int userId, int ticketId, string ticketTitle);
        Task NotifyTaskCreatedAsync(int userId, int ticketId, string taskTitle);
        Task NotifyCommentAddedAsync(int userId, int ticketId, string ticketTitle);
    }
}
