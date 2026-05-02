using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.Dtos.TicketsDto
{
    public class TicketDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public string ResolutionText { get; set; } = "";

        public LookupDto? TicketCategory { get; set; }
        public LookupDto? TicketPriority { get; set; }
        public LookupDto? Status { get; set; }
        public LookupDto? TicketDepartment { get; set; }
    }
}
