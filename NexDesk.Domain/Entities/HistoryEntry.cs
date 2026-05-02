using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.Entities
{
    public class HistoryEntry
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public int ChangedByUserId { get; set; }

        public string ActionType { get; set; } = string.Empty;
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public DateTime CreatedAt { get; set; }

        public Ticket? Ticket { get; set; }
        public User? ChangedByUser { get; set; }
    }

}
