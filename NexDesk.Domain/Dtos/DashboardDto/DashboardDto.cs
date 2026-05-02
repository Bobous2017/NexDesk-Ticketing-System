using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.Dtos.DashboardDto
{
    public class DashboardDto
    {
        public int OpenTickets { get; set; }
        public int InProgressTickets { get; set; }
        public int ResolvedTickets { get; set; }
        public int TotalTickets { get; set; }

        public int ActiveAssignees { get; set; }
        public int UnassignedTickets { get; set; }
        public int OverdueTickets { get; set; }

        public List<DashboardTicketItemDto> RecentTickets { get; set; } = new();
    }
}
