namespace NexDesk.Web.Models
{
    public class NotificationVm
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int? TicketId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public string UserName { get; set; } = "Unknown";
        public string TicketTitle { get; set; } = string.Empty;
    }

}
