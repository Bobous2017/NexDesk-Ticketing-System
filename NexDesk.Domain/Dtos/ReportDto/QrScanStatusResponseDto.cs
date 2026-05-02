using System;

namespace NexDesk.Domain.Dtos.ReportDto
{
    public class QrScanStatusResponseDto
    {
        public int ReportId { get; set; }
        public bool IsApproved { get; set; }
        public bool IsRevoked { get; set; }
        public bool IsUsed { get; set; }
        public bool IsExpired { get; set; }
        public DateTime? ExpiresAtUtc { get; set; }
        public DateTime? ApprovedAtUtc { get; set; }
        public int? ApprovedByUserId { get; set; }
    }
}
