using System;

namespace NexDesk.Domain.Dtos.ReportDto
{
    public class QrApproveScanResponseDto
    {
        public int ReportId { get; set; }
        public int TicketId { get; set; }
        public string AccessGrant { get; set; } = string.Empty;
        public DateTime AccessGrantExpiresAtUtc { get; set; }
        public DateTime ApprovedAtUtc { get; set; }
        public int ApprovedByUserId { get; set; }
    }
}
