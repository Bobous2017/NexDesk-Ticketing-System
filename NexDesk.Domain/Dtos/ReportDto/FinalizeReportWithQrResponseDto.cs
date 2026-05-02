using System;

namespace NexDesk.Domain.Dtos.ReportDto
{
    public class FinalizeReportWithQrResponseDto
    {
        public ReportDto Report { get; set; } = new ReportDto();
        public string QrToken { get; set; } = string.Empty;
        public DateTime QrTokenExpiresAtUtc { get; set; }
    }
}
