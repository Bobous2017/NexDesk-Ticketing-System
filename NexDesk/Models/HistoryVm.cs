namespace NexDesk.Web.Models
{
    public class HistoryVm
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public int ChangedByUserId { get; set; }
        public string ActionType { get; set; } = string.Empty;
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public DateTime CreatedAt { get; set; }
        public string ChangedByUserName { get; set; } = "Unknown";
    }

}
