namespace NexDesk.Web.Models
{
    public class TicketVm
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }

        // Foreign keys
        public int CreatedByUserId { get; set; }
        public int? AssignedToUserId { get; set; }
        public int TicketCategoryId { get; set; }
        public int TicketPriorityId { get; set; }
        public int StatusId { get; set; }
        public int TicketDepartmentId { get; set; }

        // Resolved names (from Include())
        public string? CategoryName { get; set; }
        public string? PriorityName { get; set; }
        public string? StatusName { get; set; }
        public string? DepartmentName { get; set; }
        public string? AssignedToName { get; set; }
        public string? CreatedByName { get; set; }

        // Dates
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? ClosedAt { get; set; }
    }
}
