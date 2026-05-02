namespace NexDesk.Domain.Dtos.HistoryDto
{
    public class CreateHistoryEntryDto
    {
        public int TicketId { get; set; }
        public int ChangedByUserId { get; set; }
        public string ActionType { get; set; } = string.Empty;
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
    }
}
