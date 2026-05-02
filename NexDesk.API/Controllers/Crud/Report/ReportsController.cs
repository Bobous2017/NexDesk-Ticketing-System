using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexDesk.Domain.Dtos.ReportDto;
using NexDesk.Domain.Entities;
using NexDesk.Domain.IServices;
using NexDesk.Infrastructure;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;

namespace NexDesk.API.Controllers.Crud.Report
{
    [ApiController]
    [Route("api/reports")]
    public class ReportsController : ControllerBase
    {
        private readonly NexDeskDbContext _db;
        private readonly IDataProtector _qrAccessGrantProtector;
        private static readonly SemaphoreSlim QrSchemaLock = new(1, 1);
        private static volatile bool _qrSchemaEnsured;
        private readonly IEmailService _emailService;
        private readonly INotificationService _notification;

        public ReportsController(NexDeskDbContext db, IDataProtectionProvider dataProtectionProvider, IEmailService emailService, INotificationService notification)
        {
            _db = db;
            _qrAccessGrantProtector = dataProtectionProvider.CreateProtector("NexDesk.Reports.QrAccessGrant.v1");
            _emailService = emailService;
            _notification = notification;
        }

        [HttpGet]
        ///<summary>
        //Returns all reports ordered by newest first.
        /// </summary>
        public async Task<IActionResult> GetAll()
        {
            var items = await _db.Reports
                .Include(x => x.CreatedByUser)
                .Include(x => x.Ticket)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new ReportDto
                {
                    Id = x.Id,
                    TicketId = x.TicketId,
                    CreatedByUserId = x.CreatedByUserId,
                    Summary = x.Summary,
                    ResolutionText = x.ResolutionText,
                    CreatedAt = x.CreatedAt,
                    CreatedByUserName = x.CreatedByUser != null
                        ? ((x.CreatedByUser.FirstName ?? "") + " " + (x.CreatedByUser.LastName ?? "")).Trim()
                        : "Unknown",
                    TicketTitle = x.Ticket != null ? x.Ticket.Title : "",
                    AdminFeedback = x.AdminFeedback,
                    ClosedAt = x.ClosedAt,
                    CustomerEmailSentAt = x.CustomerEmailSentAt,
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpPost("finalize")]
        /// <summary>
        /// Finalizes a report flow by creating a report if needed and issuing a secure QR token.
        /// </summary>
        public async Task<IActionResult> FinalizeWithQr([FromBody] FinalizeReportWithQrRequestDto dto)
        {
            await EnsureQrReportSchemaAsync();

            if (dto == null)
                return BadRequest("Report payload is required.");

            if (dto.TicketId <= 0)
                return BadRequest("Invalid TicketId.");

            if (dto.CreatedByUserId <= 0)
                return BadRequest("Invalid CreatedByUserId.");

            if (string.IsNullOrWhiteSpace(dto.Summary))
                return BadRequest("Summary is required.");

            if (string.IsNullOrWhiteSpace(dto.ResolutionText))
                return BadRequest("ResolutionText is required.");

            var ttlMinutes = dto.QrTokenTtlMinutes <= 0 ? 5 : Math.Min(dto.QrTokenTtlMinutes, 60);

            var ticketExists = await _db.TicketTask.AnyAsync(x => x.Id == dto.TicketId);
            if (!ticketExists)
                return BadRequest("Invalid TicketId.");

            var userExists = await _db.Users.AnyAsync(x => x.Id == dto.CreatedByUserId);
            if (!userExists)
                return BadRequest("Invalid CreatedByUserId.");

            var report = dto.ReuseExistingReport
                ? await _db.Reports
                    .FirstOrDefaultAsync(x => x.TicketId == dto.TicketId)
                : null;

            if (report == null)
            {
                report = new Domain.Entities.Report
                {
                    TicketId = dto.TicketId,
                    CreatedByUserId = dto.CreatedByUserId,
                    Summary = dto.Summary.Trim(),
                    ResolutionText = dto.ResolutionText.Trim(),
                    CreatedAt = DateTime.UtcNow
                };
                _db.Reports.Add(report);
            }
            else
            {
                report.Summary = dto.Summary.Trim();
                report.ResolutionText = dto.ResolutionText.Trim();
            }

            var qrToken = GenerateQrToken();
            report.QrTokenHash = ComputeSha256Hex(qrToken);
            report.QrTokenExpiresAtUtc = DateTime.UtcNow.AddMinutes(ttlMinutes);
            report.QrApprovedByUserId = null;
            report.QrApprovedAtUtc = null;
            report.QrUsedAtUtc = null;
            report.QrRevokedAtUtc = null;

            await _db.SaveChangesAsync();

            // notifications here  when  Confirm and Generate Report + QR btn  is clicked in the UI, so we can notify users that report is ready and QR is generated for scanning
            var ticket = await _db.TicketTask.FirstOrDefaultAsync(x => x.Id == dto.TicketId);
            if (ticket != null)
            {
                // Notify ticket creator
                await _notification.CreateAsync(
                    ticket.CreatedByUserId,
                    "InComming - From Orignator",
                    $"Report and QR code generated for ticket #{ticket.Id}: {ticket.Title}",
                    ticket.Id
                );

                // Notify assigned supporter
                if (ticket.AssignedToUserId.HasValue)
                    await _notification.CreateAsync(
                        ticket.AssignedToUserId.Value,
                        "InComming - From Supporter",
                        $"Report and QR code generated for ticket #{ticket.Id}: {ticket.Title}",
                        ticket.Id
                    );
            }

            var savedReport = await _db.Reports
                .Include(x => x.CreatedByUser)
                .Include(x => x.Ticket)
                .FirstAsync(x => x.Id == report.Id);

            var response = new FinalizeReportWithQrResponseDto
            {
                Report = new ReportDto
                {
                    Id = savedReport.Id,
                    TicketId = savedReport.TicketId,
                    CreatedByUserId = savedReport.CreatedByUserId,
                    QrApprovedByUserId = savedReport.QrApprovedByUserId,
                    Summary = savedReport.Summary,
                    ResolutionText = savedReport.ResolutionText,
                    CreatedAt = savedReport.CreatedAt,
                    QrTokenHash = savedReport.QrTokenHash,
                    QrTokenExpiresAtUtc = savedReport.QrTokenExpiresAtUtc,
                    QrApprovedAtUtc = savedReport.QrApprovedAtUtc,
                    QrUsedAtUtc = savedReport.QrUsedAtUtc,
                    QrRevokedAtUtc = savedReport.QrRevokedAtUtc,
                    CreatedByUserName = savedReport.CreatedByUser != null
                        ? ((savedReport.CreatedByUser.FirstName ?? "") + " " + (savedReport.CreatedByUser.LastName ?? "")).Trim()
                        : "Unknown",
                    TicketTitle = savedReport.Ticket?.Title ?? string.Empty,
                    AdminFeedback = report.AdminFeedback,
                    ClosedAt = report.ClosedAt
                },
                QrToken = qrToken,
                QrTokenExpiresAtUtc = savedReport.QrTokenExpiresAtUtc ?? DateTime.UtcNow
            };

            return Ok(response);
        }

        [HttpPost("approve-scan")]
        /// <summary>
        /// Approves a scan directly from QR token and user id.
        /// This endpoint is compatible with clients that only post scanned token (without report id route).
        /// </summary>
        public async Task<IActionResult> ApproveScanByToken([FromBody] QrApproveByTokenRequestDto dto)
        {
            await EnsureQrReportSchemaAsync();

            if (dto == null)
                return BadRequest("Approval payload is required.");

            if (string.IsNullOrWhiteSpace(dto.QrToken))
                return BadRequest("QrToken is required.");

            if (dto.ApprovedByUserId <= 0)
                return BadRequest("Invalid ApprovedByUserId.");

            var approvedByUserExists = await _db.Users.AnyAsync(x => x.Id == dto.ApprovedByUserId);
            if (!approvedByUserExists)
                return BadRequest("Invalid ApprovedByUserId.");

            var tokenHash = ComputeSha256Hex(dto.QrToken.Trim());
            var report = await _db.Reports.FirstOrDefaultAsync(x => x.QrTokenHash == tokenHash);
            if (report == null)
                return NotFound("Invalid QR token.");

            if (report.QrRevokedAtUtc.HasValue)
                return BadRequest("QR token has been revoked.");

            if (report.QrUsedAtUtc.HasValue && !report.QrApprovedAtUtc.HasValue)
                return BadRequest("QR token has already been used.");

            if (report.QrTokenExpiresAtUtc.HasValue && report.QrTokenExpiresAtUtc.Value < DateTime.UtcNow)
                return BadRequest("QR token has expired.");

            var approvedAtUtc = DateTime.UtcNow;
            report.QrApprovedByUserId = dto.ApprovedByUserId;
            report.QrApprovedAtUtc = approvedAtUtc;
            report.QrUsedAtUtc = approvedAtUtc;  

            await _db.SaveChangesAsync();

            var ttlMinutes = dto.AccessGrantTtlMinutes <= 0 ? 5 : Math.Min(dto.AccessGrantTtlMinutes, 15);
            var grantExpiresAtUtc = DateTime.UtcNow.AddMinutes(ttlMinutes);
            var accessGrant = CreateAccessGrant(report.Id, report.TicketId, dto.ApprovedByUserId, approvedAtUtc, grantExpiresAtUtc);

            return Ok(new QrApproveScanResponseDto
            {
                ReportId = report.Id,
                TicketId = report.TicketId,
                AccessGrant = accessGrant,
                AccessGrantExpiresAtUtc = grantExpiresAtUtc,
                ApprovedAtUtc = approvedAtUtc,
                ApprovedByUserId = dto.ApprovedByUserId
            });
        }

        [HttpPost("{id:int}/start-scan")]
        /// <summary>
        /// Starts a QR scan session by rotating QR token and returning raw token for QR rendering.
        /// </summary>
        public async Task<IActionResult> StartScan(int id, [FromQuery] int ttlMinutes = 5)
        {
            await EnsureQrReportSchemaAsync();

            if (id <= 0)
                return BadRequest("Invalid report id.");

            var exists = await _db.Reports.AnyAsync(x => x.Id == id);
            if (!exists)
                return NotFound("Report not found.");

            var safeTtl = ttlMinutes <= 0 ? 5 : Math.Min(ttlMinutes, 60);
            var qrToken = GenerateQrToken();
            var tokenHash = ComputeSha256Hex(qrToken);
            var expiresAtUtc = DateTime.UtcNow.AddMinutes(safeTtl);

            // Force update fields in DB to ensure session is truly reset
            await _db.Reports
                .Where(x => x.Id == id)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(r => r.QrTokenHash, tokenHash)
                    .SetProperty(r => r.QrTokenExpiresAtUtc, expiresAtUtc)
                    .SetProperty(r => r.QrApprovedByUserId, (int?)null)
                    .SetProperty(r => r.QrApprovedAtUtc, (DateTime?)null)
                    .SetProperty(r => r.QrUsedAtUtc, (DateTime?)null)
                    .SetProperty(r => r.QrRevokedAtUtc, (DateTime?)null));

            return Ok(new QrStartScanResponseDto
            {
                ReportId = id,
                QrToken = qrToken,
                ExpiresAtUtc = expiresAtUtc
            });
        }

        [HttpGet("{id:int}/scan-status")]
        /// <summary>
        /// Returns current QR scan lifecycle state for a report.
        /// </summary>
        public async Task<IActionResult> GetScanStatus(int id)
        {
            await EnsureQrReportSchemaAsync();

            if (id <= 0)
                return BadRequest("Invalid report id.");

            // Use AsNoTracking to avoid context issues and ensure fresh data
            var report = await _db.Reports.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (report == null)
                return NotFound("Report not found.");

            // Logic: Only expired if well past the deadline (grace period for clock skew).
            var isExpired = report.QrTokenExpiresAtUtc.HasValue && report.QrTokenExpiresAtUtc.Value.AddSeconds(30) < DateTime.UtcNow;
            var isApproved = report.QrApprovedAtUtc.HasValue;

            return Ok(new QrScanStatusResponseDto
            {
                ReportId = report.Id,
                IsApproved = isApproved,
                IsRevoked = report.QrRevokedAtUtc.HasValue,
                // Only treat as 'Used' (error) if it wasn't actually approved.
                // Scan processes often mark 'Used' and 'Approved' simultaneously.
                IsUsed = !isApproved && report.QrUsedAtUtc.HasValue,
                IsExpired = isExpired,
                ExpiresAtUtc = report.QrTokenExpiresAtUtc,
                ApprovedAtUtc = report.QrApprovedAtUtc,
                ApprovedByUserId = report.QrApprovedByUserId
            });
        }

        [HttpPost("{id:int}/issue-grant")]
        /// <summary>
        /// Issues a short-lived secure detail grant after QR approval has completed.
        /// </summary>
        public async Task<IActionResult> IssueGrant(int id, [FromQuery] int ttlMinutes = 5)
        {
            await EnsureQrReportSchemaAsync();

            if (id <= 0)
                return BadRequest("Invalid report id.");

            var report = await _db.Reports.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (report == null)
                return NotFound("Report not found.");

            if (!report.QrApprovedAtUtc.HasValue)
                return BadRequest("QR approval is required.");

            if (report.QrRevokedAtUtc.HasValue)
                return BadRequest("QR token has been revoked.");

            // If it's used but NEVER approved, then it's dead. 
            // But if it's approved, we allow issuing the grant.
            if (report.QrUsedAtUtc.HasValue && !report.QrApprovedAtUtc.HasValue)
                return BadRequest("QR token has already been used.");

            if (report.QrTokenExpiresAtUtc.HasValue && report.QrTokenExpiresAtUtc.Value < DateTime.UtcNow)
                return BadRequest("QR token has expired.");

            var safeTtl = ttlMinutes <= 0 ? 5 : Math.Min(ttlMinutes, 15);
            var grantExpiresAtUtc = DateTime.UtcNow.AddMinutes(safeTtl);
            var grant = CreateAccessGrant(
                report.Id,
                report.TicketId,
                report.QrApprovedByUserId ?? 0,
                report.QrApprovedAtUtc.Value,
                grantExpiresAtUtc);

            return Ok(new QrApproveScanResponseDto
            {
                ReportId = report.Id,
                TicketId = report.TicketId,
                AccessGrant = grant,
                AccessGrantExpiresAtUtc = grantExpiresAtUtc,
                ApprovedAtUtc = report.QrApprovedAtUtc.Value,
                ApprovedByUserId = report.QrApprovedByUserId ?? 0
            });
        }

        [HttpPost("{id:int}/approve-scan")]
        /// <summary>
        /// Approves validated QR scan and issues short-lived access grant for secure report detail.
        /// </summary>
        public async Task<IActionResult> ApproveScan(int id, [FromBody] QrApproveScanRequestDto dto)
        {
            await EnsureQrReportSchemaAsync();

            if (id <= 0)
                return BadRequest("Invalid report id.");

            if (dto == null)
                return BadRequest("Approval payload is required.");

            if (dto.ApprovedByUserId <= 0)
                return BadRequest("Invalid ApprovedByUserId.");

            var approvedByUserExists = await _db.Users.AnyAsync(x => x.Id == dto.ApprovedByUserId);
            if (!approvedByUserExists)
                return BadRequest("Invalid ApprovedByUserId.");

            var report = await _db.Reports.FirstOrDefaultAsync(x => x.Id == id);
            if (report == null)
                return NotFound("Report not found.");

            if (report.QrRevokedAtUtc.HasValue)
                return BadRequest("QR token has been revoked.");

            // Soften: only block if used but NOT approved.
            if (report.QrUsedAtUtc.HasValue && !report.QrApprovedAtUtc.HasValue)
                return BadRequest("QR token has already been used.");

            if (report.QrTokenExpiresAtUtc.HasValue && report.QrTokenExpiresAtUtc.Value < DateTime.UtcNow)
                return BadRequest("QR token has expired.");

            var approvedAtUtc = DateTime.UtcNow;
            report.QrApprovedByUserId = dto.ApprovedByUserId;
            report.QrApprovedAtUtc = approvedAtUtc;
            report.QrUsedAtUtc = approvedAtUtc;  // Track when QR was scanned/used

            await _db.SaveChangesAsync();

            var ttlMinutes = dto.AccessGrantTtlMinutes <= 0 ? 5 : Math.Min(dto.AccessGrantTtlMinutes, 15);
            var grantExpiresAtUtc = DateTime.UtcNow.AddMinutes(ttlMinutes);
            var accessGrant = CreateAccessGrant(report.Id, report.TicketId, dto.ApprovedByUserId, approvedAtUtc, grantExpiresAtUtc);

            var response = new QrApproveScanResponseDto
            {
                ReportId = report.Id,
                TicketId = report.TicketId,
                AccessGrant = accessGrant,
                AccessGrantExpiresAtUtc = grantExpiresAtUtc,
                ApprovedAtUtc = approvedAtUtc,
                ApprovedByUserId = dto.ApprovedByUserId
            };

            return Ok(response);
        }

        [HttpGet("{id:int}/secure")]
        /// <summary>
        /// Returns secure report details only when access grant is valid and report QR state allows access.
        /// </summary>
        public async Task<IActionResult> GetSecureById(int id, [FromQuery] string grant)
        {
            if (id <= 0)
                return BadRequest("Invalid report id.");

            if (string.IsNullOrWhiteSpace(grant))
                return BadRequest("Access grant is required.");

            var payload = ParseAccessGrant(grant);
            if (payload == null)
                return Unauthorized("Invalid access grant.");

            if (payload.ReportId != id)
                return Unauthorized("Access grant does not match report.");

            if (payload.ExpiresAtUtc < DateTime.UtcNow)
                return Unauthorized("Access grant expired.");

            var report = await _db.Reports
                .Include(x => x.CreatedByUser)
                .Include(x => x.Ticket)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (report == null)
                return NotFound("Report not found.");

            if (!report.QrApprovedAtUtc.HasValue)
                return Unauthorized("QR approval is required.");

            if (report.QrRevokedAtUtc.HasValue)
                return Unauthorized("QR token has been revoked.");

            if (report.QrTokenExpiresAtUtc.HasValue && report.QrTokenExpiresAtUtc.Value < DateTime.UtcNow)
                return Unauthorized("QR token has expired.");

            if (report.QrApprovedAtUtc.Value.Ticks != payload.ApprovedAtUtcTicks)
                return Unauthorized("Access grant is no longer valid for this approval.");

            var dto = new ReportDto
            {
                Id = report.Id,
                TicketId = report.TicketId,
                CreatedByUserId = report.CreatedByUserId,
                QrApprovedByUserId = report.QrApprovedByUserId,
                Summary = report.Summary,
                ResolutionText = report.ResolutionText,
                CreatedAt = report.CreatedAt,
                QrTokenHash = report.QrTokenHash,
                QrTokenExpiresAtUtc = report.QrTokenExpiresAtUtc,
                QrApprovedAtUtc = report.QrApprovedAtUtc,
                QrUsedAtUtc = report.QrUsedAtUtc,
                QrRevokedAtUtc = report.QrRevokedAtUtc,
                CreatedByUserName = report.CreatedByUser != null
                    ? ((report.CreatedByUser.FirstName ?? "") + " " + (report.CreatedByUser.LastName ?? "")).Trim()
                    : "Unknown",
                TicketTitle = report.Ticket?.Title ?? string.Empty,
                AdminFeedback = report.AdminFeedback,
                ClosedAt = report.ClosedAt
            };

            return Ok(dto);
        }

        [HttpPost("scan-validate")]
        /// <summary>
        /// Validates a scanned QR token and returns report context for approval flow.
        /// </summary>
        public async Task<IActionResult> ValidateScan([FromBody] QrScanValidateRequestDto dto)
        {
            await EnsureQrReportSchemaAsync();

            if (dto == null || string.IsNullOrWhiteSpace(dto.QrToken))
                return BadRequest("QrToken is required.");

            var tokenHash = ComputeSha256Hex(dto.QrToken.Trim());
            var report = await _db.Reports.FirstOrDefaultAsync(x => x.QrTokenHash == tokenHash);

            if (report == null)
                return NotFound("Invalid QR token.");

            if (report.QrRevokedAtUtc.HasValue)
                return BadRequest("QR token has been revoked.");

            // Allow validation even if marked used, as long as it's not revoked. 
            // This ensures the mobile app can show the 'Approve' screen even if it hit an endpoint earlier.
            if (report.QrUsedAtUtc.HasValue && !report.QrApprovedAtUtc.HasValue)
                return BadRequest("QR token has already been used.");

            if (!report.QrTokenExpiresAtUtc.HasValue || report.QrTokenExpiresAtUtc.Value < DateTime.UtcNow)
                return BadRequest("QR token has expired.");

            var response = new QrScanValidateResponseDto
            {
                ReportId = report.Id,
                TicketId = report.TicketId,
                RequiresApproval = true,
                Status = report.QrApprovedAtUtc.HasValue ? "Approved" : "PendingApproval",
                ExpiresAtUtc = report.QrTokenExpiresAtUtc
            };

            return Ok(response);
        }

        private static string GenerateQrToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToBase64String(bytes)
                .Replace('+', '-')
                .Replace('/', '_')
                .TrimEnd('=');
        }

        private static string ComputeSha256Hex(string value)
        {
            var bytes = Encoding.UTF8.GetBytes(value);
            var hash = SHA256.HashData(bytes);
            return Convert.ToHexString(hash);
        }

        private string CreateAccessGrant(int reportId, int ticketId, int approvedByUserId, DateTime approvedAtUtc, DateTime expiresAtUtc)
        {
            var payload = new AccessGrantPayload
            {
                ReportId = reportId,
                TicketId = ticketId,
                ApprovedByUserId = approvedByUserId,
                ApprovedAtUtcTicks = approvedAtUtc.Ticks,
                ExpiresAtUtc = expiresAtUtc
            };

            var json = JsonSerializer.Serialize(payload);
            return _qrAccessGrantProtector.Protect(json);
        }

        private AccessGrantPayload? ParseAccessGrant(string grant)
        {
            try
            {
                var json = _qrAccessGrantProtector.Unprotect(grant);
                return JsonSerializer.Deserialize<AccessGrantPayload>(json);
            }
            catch (CryptographicException)
            {
                return null;
            }
            catch (JsonException)
            {
                return null;
            }
        }

        private sealed class AccessGrantPayload
        {
            public int ReportId { get; set; }
            public int TicketId { get; set; }
            public int ApprovedByUserId { get; set; }
            public long ApprovedAtUtcTicks { get; set; }
            public DateTime ExpiresAtUtc { get; set; }
        }

        public class CloseReportRequest
        {
            public string? AdminFeedback { get; set; }
        }

        [HttpPost("{id:int}/close")]
        public async Task<IActionResult> CloseReport(int id, [FromBody] CloseReportRequest dto)
        {
            var report = await _db.Reports.FirstOrDefaultAsync(x => x.Id == id);
            if (report == null) return NotFound("Report not found.");
            if (report.ClosedAt.HasValue) return BadRequest("Report is already closed.");

            report.AdminFeedback = dto?.AdminFeedback?.Trim();
            report.ClosedAt = DateTime.UtcNow;

            // Close the linked ticket — look up status by name, not hardcoded ID
            var ticket = await _db.TicketTask.FirstOrDefaultAsync(x => x.Id == report.TicketId);
            if (ticket != null)
            {
                var closedStatus = await _db.Statuses.FirstOrDefaultAsync(s => s.Name == "Closed");
                if (closedStatus != null)
                    ticket.StatusId = closedStatus.Id;
                ticket.ClosedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            // Notify involved users about ticket is  closed — this is done after saving to ensure we have the latest ticket state for notifications
            if (ticket != null)
            {
                await _notification.NotifyTicketClosedAsync(ticket.CreatedByUserId, ticket.Id, ticket.Title);

                if (ticket.AssignedToUserId.HasValue)
                    await _notification.NotifyTicketClosedAsync(ticket.AssignedToUserId.Value, ticket.Id, ticket.Title);
            }


            // Send closure email to customer and supporters
            await SendTicketClosedEmailsAsync(report.AdminFeedback, ticket);
            return Ok(new { message = "Report closed.", reportId = id });
        }

        public class SendCustomerEmailRequest
        {
            public string? CustomerEmail { get; set; }
            public bool ForceResend { get; set; } = false;
        }

        [HttpPost("{id:int}/send-customer-email")]
        public async Task<IActionResult> SendCustomerEmail(int id, [FromBody] SendCustomerEmailRequest dto)
        {
            var report = await _db.Reports
                .Include(x => x.EmailLogs)
                .FirstOrDefaultAsync(x => x.Id == id);
            if (report == null) return NotFound("Report not found.");

            var ticket = await _db.TicketTask
                .Include(t => t.CreatedByUser)
                .FirstOrDefaultAsync(x => x.Id == report.TicketId);
            if (ticket == null) return BadRequest("Ticket not found.");

            var toEmail = dto?.CustomerEmail?.Trim();
            if (string.IsNullOrEmpty(toEmail))
                toEmail = ticket.CreatedByUser?.Email;
            if (string.IsNullOrEmpty(toEmail))
                return BadRequest("No email address provided.");

            // Check if this email already received this report
            var existingLog = report.EmailLogs
                .FirstOrDefault(x => x.SentToEmail.ToLower() == toEmail.ToLower());

            if (existingLog != null && dto?.ForceResend != true)
            {
                return Conflict(new
                {
                    alreadySent = true,
                    sentAt = existingLog.SentAt,
                    email = toEmail,
                    message = $"Denne email {toEmail} har allerede modtaget denne rapport."
                });
            }

            var toName = ticket.CreatedByUser != null
                ? $"{ticket.CreatedByUser.FirstName} {ticket.CreatedByUser.LastName}".Trim()
                : "Kunde";

            await _emailService.SendTicketClosedAsync(
                toEmail: toEmail,
                toName: toName,
                ticketTitle: ticket.Title ?? "",
                ticketId: ticket.Id,
                adminFeedback: ticket.Description ?? "",
                isCustomer: true,
                resolutionText: report.ResolutionText ?? ""

            );

            // Log the email
            _db.ReportEmailLogs.Add(new ReportEmailLog
            {
                ReportId = id,
                SentToEmail = toEmail,
                SentAt = DateTime.UtcNow
            });

            report.CustomerEmailSentAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Customer email sent." });
        }

        private async Task SendTicketClosedEmailsAsync(string? adminFeedback, Ticket? ticket)
        {
            if (ticket == null) return;
            var report = await _db.Reports.FirstOrDefaultAsync(x => x.TicketId == ticket.Id);

            var involvedUserIds = new HashSet<int>();

            if (ticket.AssignedToUserId.HasValue)
                involvedUserIds.Add(ticket.AssignedToUserId.Value);

            var taskAssignees = await _db.Tasks
                .Where(t => t.TicketId == ticket.Id && t.AssignedUserId != null)
                .Select(t => t.AssignedUserId!.Value)
                .ToListAsync();

            foreach (var uid in taskAssignees)
                involvedUserIds.Add(uid);

            var supporters = await _db.Users
                .Where(u => involvedUserIds.Contains(u.Id) && u.Role.Name == "Supporter")
                .Include(u => u.Role)
                .ToListAsync();

            foreach (var user in supporters)
            {
                await _emailService.SendTicketClosedAsync(
                    toEmail: user.Email,
                    toName: $"{user.FirstName} {user.LastName}",
                    ticketTitle: ticket.Title,
                    ticketId: ticket.Id,
                    adminFeedback: adminFeedback ?? "",
                    isCustomer: false,
                    resolutionText: report?.ResolutionText ?? ""
                );
            }
        }
        private async Task EnsureQrReportSchemaAsync()
        {
            if (_qrSchemaEnsured) return;

            if (!(_db.Database.ProviderName?.Contains("SqlServer", StringComparison.OrdinalIgnoreCase) ?? false))
            {
                _qrSchemaEnsured = true;
                return;
            }

            await QrSchemaLock.WaitAsync();
            try
            {
                if (_qrSchemaEnsured) return;

                await _db.Database.ExecuteSqlRawAsync(@"
IF COL_LENGTH('Reports', 'Qr_Approved_By_User_Id') IS NULL
    ALTER TABLE [Reports] ADD [Qr_Approved_By_User_Id] INT NULL;

IF COL_LENGTH('Reports', 'Qr_Token_Hash') IS NULL
    ALTER TABLE [Reports] ADD [Qr_Token_Hash] NVARCHAR(256) NULL;

IF COL_LENGTH('Reports', 'Qr_Token_Expires_At_Utc') IS NULL
    ALTER TABLE [Reports] ADD [Qr_Token_Expires_At_Utc] DATETIME2 NULL;

IF COL_LENGTH('Reports', 'Qr_Approved_At_Utc') IS NULL
    ALTER TABLE [Reports] ADD [Qr_Approved_At_Utc] DATETIME2 NULL;

IF COL_LENGTH('Reports', 'Qr_Used_At_Utc') IS NULL
    ALTER TABLE [Reports] ADD [Qr_Used_At_Utc] DATETIME2 NULL;

IF COL_LENGTH('Reports', 'Qr_Revoked_At_Utc') IS NULL
    ALTER TABLE [Reports] ADD [Qr_Revoked_At_Utc] DATETIME2 NULL;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Reports_Qr_Approved_By_User_Id'
      AND object_id = OBJECT_ID('Reports')
)
    CREATE INDEX [IX_Reports_Qr_Approved_By_User_Id] ON [Reports]([Qr_Approved_By_User_Id]);

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Reports_Users_Qr_Approved_By_User_Id'
)
    ALTER TABLE [Reports]
    ADD CONSTRAINT [FK_Reports_Users_Qr_Approved_By_User_Id]
    FOREIGN KEY ([Qr_Approved_By_User_Id]) REFERENCES [Users]([Id]);
");

                _qrSchemaEnsured = true;
            }
            finally
            {
                QrSchemaLock.Release();
            }
        }
    }

}
