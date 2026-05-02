using System;

namespace NexDesk.Domain.Dtos.ReportDto
{
    public class QrStartScanResponseDto
    {
        public int ReportId { get; set; }
        public string QrToken { get; set; } = string.Empty;
        public DateTime ExpiresAtUtc { get; set; }
    }
}
