using System;

namespace NexDesk.Domain.Dtos.ReportDto
{
    public class QrScanValidateResponseDto
    {
        public int ReportId { get; set; }
        public int TicketId { get; set; }
        public bool RequiresApproval { get; set; } = true;
        public string Status { get; set; } = string.Empty;
        public DateTime? ExpiresAtUtc { get; set; }
    }
}
