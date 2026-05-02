namespace NexDesk.Domain.Dtos.ReportDto
{
    public class QrApproveScanRequestDto
    {
        public int ApprovedByUserId { get; set; }
        public int AccessGrantTtlMinutes { get; set; } = 5;
    }
}
