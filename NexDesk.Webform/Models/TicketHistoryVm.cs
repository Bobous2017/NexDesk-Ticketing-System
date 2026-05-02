namespace NexDesk.Webform.Models
{
    public class TicketHistoryVm
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public string CategoryName { get; set; } = "";
        public string PriorityName { get; set; } = "";
        public string StatusName { get; set; } = "";
        public string DepartmentName { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public string ResolutionText { get; set; } = "";

    }
}
