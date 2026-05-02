namespace NexDesk.Domain.Dtos.ReportDto
{
    public class FinalizeReportWithQrRequestDto
    {
        public int TicketId { get; set; }
        public int CreatedByUserId { get; set; }
        public string Summary { get; set; } = string.Empty;
        public string ResolutionText { get; set; } = string.Empty;
        public bool ReuseExistingReport { get; set; } = true;
        public int QrTokenTtlMinutes { get; set; } = 5;
    }
}
