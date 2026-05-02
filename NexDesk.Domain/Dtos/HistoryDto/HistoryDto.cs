using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.Dtos.HistoryDto

{
    public class HistoryDto
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public int ChangedByUserId { get; set; }
        public string ActionType { get; set; } = string.Empty;
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public DateTime CreatedAt { get; set; }

        public string ChangedByUserName { get; set; } = "Unknown";
    }

}
