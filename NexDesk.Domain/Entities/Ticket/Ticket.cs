using NexDesk.Domain.Entities.Task;
using NexDesk.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace NexDesk.Domain.Entities
{
    public class Ticket
    {
        public int Id { get; set; }

        public int CreatedByUserId { get; set; }
        public int? AssignedToUserId { get; set; }
        public int TicketCategoryId { get; set; }
        public int TicketPriorityId { get; set; }
        public int StatusId { get; set; }
        public int TicketDepartmentId { get; set; }

        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public DateTime? DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public bool IsActive { get; set; } = true;

        public User? CreatedByUser { get; set; }
        public User? AssignedToUser { get; set; }
        public TicketCategory? TicketCategory { get; set; }
        public TicketPriority? TicketPriority { get; set; }
        public Status? Status { get; set; }
        public TicketDepartment? TicketDepartment { get; set; }

        public ICollection<Task.TicketTask> Tasks { get; set; } = new List<Task.TicketTask>();
        public ICollection<Report> Reports { get; set; } = new List<Report>();

    }

}
