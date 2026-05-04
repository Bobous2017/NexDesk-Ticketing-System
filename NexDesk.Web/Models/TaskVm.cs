namespace NexDesk.Web.Models
{
    public class TaskVm
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public int? AssignedUserId { get; set; }
        public int? CreatedByUserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int StatusId { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
