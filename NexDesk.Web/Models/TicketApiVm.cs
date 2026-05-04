namespace NexDesk.Web.Models
{
    public class TicketApiVm
    {
        public int Id { get; set; }
        public int CreatedByUserId { get; set; }
        public int? AssignedToUserId { get; set; }
        public int TicketCategoryId { get; set; }
        public int TicketPriorityId { get; set; }
        public int StatusId { get; set; }
        public int TicketDepartmentId { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public LookupItemVm? TicketCategory { get; set; }
        public LookupItemVm? TicketPriority { get; set; }
        public LookupItemVm? Status { get; set; }
        public LookupItemVm? TicketDepartment { get; set; }
        public UserVm? AssignedToUser { get; set; }
        public DateTime? DueDate { get; set; }

        public DateTime? CreatedAt { get; set; }

    }

}
