using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.Dtos.ReportDto
{
    public class ReportDto
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public int CreatedByUserId { get; set; }
        public int? QrApprovedByUserId { get; set; }

        public string Summary { get; set; } = string.Empty;
        public string ResolutionText { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string? QrTokenHash { get; set; }
        public DateTime? QrTokenExpiresAtUtc { get; set; }
        public DateTime? QrApprovedAtUtc { get; set; }
        public DateTime? QrUsedAtUtc { get; set; }
        public DateTime? QrRevokedAtUtc { get; set; }

        public string CreatedByUserName { get; set; } = "Unknown";
        public string TicketTitle { get; set; } = string.Empty;

        public string? AdminFeedback { get; set; }
        public DateTime? ClosedAt { get; set; }

        public DateTime? CustomerEmailSentAt { get; set; }
    }

}
