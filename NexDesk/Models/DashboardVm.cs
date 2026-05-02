using NexDesk.Domain.Entities;

namespace NexDesk.Web.Models
{
    public class DashboardVm 
    {
        public int OpenTickets { get; set; }
        public int InProgressTickets { get; set; }
        public int ResolvedTickets { get; set; }
        public int TotalTickets { get; set; }

        public int ActiveAssignees { get; set; }
        public int UnassignedTickets { get; set; }
        public int OverdueTickets { get; set; }

        public List<DashboardTicketItemVm> RecentTickets { get; set; } = new();
        public List<TicketListItemVm> Tickets { get; set; } = new();
        public List<NotificationVm> Notifications { get; set; } = new();

        public List<LookupItemVm> TicketCategories { get; set; } = new();
        public List<LookupItemVm> TicketDepartments { get; set; } = new();
        public List<LookupItemVm> TicketPriorities { get; set; } = new();
        public List<LookupItemVm> TicketStatuses { get; set; } = new();

        public List<CommentVm> Comments { get; set; } = new();
        public List<HistoryVm> History { get; set; } = new();

        public List<ReportVm> Reports { get; set; } = new();

        public List<UserVm> Users { get; set; } = new();

        public List<TaskVm> Tasks { get; set; } = new();

    }
}
