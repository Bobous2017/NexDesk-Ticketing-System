namespace NexDesk.Web.Models
{
    public class ReportVm
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public int CreatedByUserId { get; set; }

        public string Summary { get; set; } = string.Empty;
        public string ResolutionText { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        public string CreatedByUserName { get; set; } = "Unknown";
        public string TicketTitle { get; set; } = string.Empty;

        public string? AdminFeedback { get; set; }
        public DateTime? ClosedAt { get; set; }

        public DateTime? CustomerEmailSentAt { get; set; }
    }

}
