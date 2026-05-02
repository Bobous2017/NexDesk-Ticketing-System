using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NexDesk.Domain.Entities;

namespace NexDesk.Domain.Entities.Task
{
    public class TicketTask
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public int? AssignedUserId { get; set; }
        public int? CreatedByUserId { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public int StatusId { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public bool IsActive { get; set; } = true;

        public Ticket? Ticket { get; set; }
        public Status? Status { get; set; }
        public User? CreatedByUser { get; set; }
        public User? AssignedUser { get; set; }

    }
}