namespace NexDesk.Domain.Dtos.ReportDto
{
    public class QrApproveByTokenRequestDto
    {
        public string QrToken { get; set; } = string.Empty;
        public int ApprovedByUserId { get; set; }
        public int AccessGrantTtlMinutes { get; set; } = 5;
    }
}
