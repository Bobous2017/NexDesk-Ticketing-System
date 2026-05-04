namespace NexDesk.Web.Models
{
    public class TicketListItemVm
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int TicketCategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int TicketPriorityId { get; set; }
        public string PriorityName { get; set; } = string.Empty;
        public int StatusId { get; set; }
        public string StatusName { get; set; } = string.Empty;
        public int TicketDepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public int? AssignedToUserId { get; set; }
        public string AssignedToName { get; set; } = "Unassigned";
        public int CreatedByUserId { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
