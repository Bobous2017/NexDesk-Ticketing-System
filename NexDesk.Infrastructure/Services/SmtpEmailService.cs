using Microsoft.Extensions.Options;
using NexDesk.Domain.Entities;
using NexDesk.Domain.IServices;
using MailAttachment = System.Net.Mail.Attachment;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Infrastructure.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly EmailSettings _settings;   // Gemmer konfigurationen (server, port, login) internt i klassen.

        // Constructor der modtager indstillingerne via Dependency Injection.
        public SmtpEmailService(IOptions<EmailSettings> settings)
        {
            _settings = settings.Value;
        }

        // Sender en e-mail asynkront med mulighed for at vedhæfte en fil (f.eks. et billede).
        public async Task SendAsync(string to, string subject, string body, Stream? attachment = null, string? attachmentName = null)
        {
            using var client = new SmtpClient(_settings.SmtpServer) // Opretter en forbindelse til SMTP-serveren med de angivne indstillinger.
            {
                Port = _settings.Port, // Portnummeret (typisk 587 for TLS).
                Credentials = new NetworkCredential(_settings.SenderEmail, _settings.SenderPassword), // Login-oplysninger. 
                EnableSsl = _settings.EnableSsl // Aktiverer SSL/TLS for sikker forbindelse.
            };

            var mail = new MailMessage(_settings.SenderEmail, to, subject, body) // Opretter selve e-mail-objektet med afsender, modtager, emne og indhold.
            {
                IsBodyHtml = true // Gør det muligt at bruge HTML-formatering i e-mailen.
            };

            if (attachment != null && !string.IsNullOrEmpty(attachmentName))// Tjekker om der er sendt en fil med, som skal vedhæftes e-mailen.
            {
                mail.Attachments.Add(new MailAttachment(attachment, attachmentName, "image/png"));// Tilføjer den vedhæftede fil (her låst til PNG-format).
            }

            await client.SendMailAsync(mail);// Sender e-mailen afsted uden at blokere for resten af programmet.
        }

        // Sender en e-mail specifikt til password reset, hvor e-mailen indeholder en OTP-kode og et link til at nulstille adgangskoden. E-mailens indhold er formateret i HTML for at give en professionel og brugervenlig oplevelse.
        public async Task SendPasswordResetAsync(string toEmail, string userName, string otpCode, string resetLink)
        {
            var spacedOtp = string.Join(" ", otpCode.ToCharArray());
            var subject = "Nulstil din adgangskode — NexDesk";
            var body = $@"
            <!DOCTYPE html>
            <html><head><meta charset='UTF-8'></head>
            <body style='margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,sans-serif;'>
              <table width='100%' cellpadding='0' cellspacing='0' style='background-color:#f3f4f6;padding:40px 0;'>
                <tr>
                  <td align='center'>
                    <table width='600' cellpadding='0' cellspacing='0' style='background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>
                      <tr>
                        <td style='background-color:#db2777;padding:28px 32px;'>
                          <h1 style='margin:0;color:#ffffff;font-size:22px;letter-spacing:0.5px;'>NexDesk</h1>
                          <p style='margin:4px 0 0;color:#fce7f3;font-size:13px;'>Adgangskode nulstilling</p>
                        </td>
                      </tr>
                      <tr>
                        <td style='padding:32px;'>
                          <p style='margin:0 0 8px;font-size:15px;color:#374151;'>Hej <strong>{userName}</strong>,</p>
                          <p style='margin:0 0 24px;font-size:15px;color:#374151;'>Vi har modtaget en anmodning om at nulstille din adgangskode.</p>
                          <table width='100%' cellpadding='0' cellspacing='0' style='border-top:1px solid #e5e7eb;font-size:14px;'>
                            <tr>
                              <td style='padding:12px 0;color:#6b7280;width:160px;'>Din nulstillingskode</td>
                              <td style='padding:12px 0;'>
                                <span style='font-size:28px;font-weight:700;color:#db2777;word-spacing:normal;letter-spacing:2px;'>{spacedOtp}</span>
                              </td>
                            </tr>
                            <tr style='border-top:1px solid #f3f4f6;'>
                              <td style='padding:8px 0;color:#6b7280;'>Udløber om</td>
                              <td style='padding:8px 0;color:#374151;'>10 minutter</td>
                            </tr>
                          </table>
                          <div style='margin-top:28px;text-align:center;'>
                            <a href='{resetLink}' style='display:inline-block;background-color:#db2777;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;'>
                              Åbn nulstillingsside
                            </a>
                          </div>
                          <p style='margin:28px 0 0;font-size:13px;color:#9ca3af;text-align:center;'>
                            Hvis du ikke har anmodet om dette, kan du ignorere denne email.<br>
                            <a href='{resetLink}' style='color:#db2777;'>{resetLink}</a>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style='background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;'>
                          <p style='margin:0;font-size:12px;color:#9ca3af;'>Dette er en automatisk besked fra NexDesk. Svar venligst ikke på denne e-mail.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body></html>";

            await SendAsync(toEmail, subject, body);
        }

        // Sender en specifik e-mail, når et ticket er blevet tildelt en supporter. E-mailen indeholder detaljer om ticketet og et link til at åbne det i systemet.
        public async Task SendTicketAssignedAsync(string to, string supporterName, int ticketId, string ticketTitle, string description, string priority, string? dueDate, string ticketUrl, string? taskTitle = null, string? createdByName = null)
        {
            var headerColor = taskTitle != null ? "#d97706" : "#2563eb"; // orange for task, blue for ticket
            var createdByRow = !string.IsNullOrEmpty(createdByName)
                ? $"<tr style='border-top:1px solid #f3f4f6;'><td style='padding:8px 0;color:#6b7280;'>Oprettet af</td><td style='padding:8px 0;color:#374151;'>{createdByName}</td></tr>"
                : "";
            var subject = taskTitle != null
                ? $"[NexDesk] Task '{taskTitle}' er tildelt dig"
                : $"[NexDesk] Ticket '{ticketTitle}' er tildelt dig";

            var dueDateRow = string.IsNullOrEmpty(dueDate)
                ? "<tr style='border-top:1px solid #f3f4f6;'><td style='padding:8px 0;color:#6b7280;'>Forfaldsdato</td><td style='padding:8px 0;color:#374151;'>Ikke angivet</td></tr>"
                : $"<tr style='border-top:1px solid #f3f4f6;'><td style='padding:8px 0;color:#6b7280;'>Forfaldsdato</td><td style='padding:8px 0;color:#374151;'>{dueDate}</td></tr>";

            var taskRow = taskTitle != null
                ? $"<tr style='border-top:1px solid #f3f4f6;'><td style='padding:8px 0;color:#6b7280;'>Task</td><td style='padding:8px 0;color:#374151;'>{taskTitle}</td></tr>"
                : "";

            var introText = taskTitle != null
                ? "En task er blevet tildelt dig. Her er detaljerne:"
                : "Et ticket er blevet tildelt dig. Her er detaljerne:";

            
            var body = $@"
            <!DOCTYPE html>
            <html lang='da'>
            <head><meta charset='UTF-8'></head>
            <body style='margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,sans-serif;'>
              <table width='100%' cellpadding='0' cellspacing='0' style='background-color:#f3f4f6;padding:40px 0;'>
                <tr>
                  <td align='center'>
                    <table width='600' cellpadding='0' cellspacing='0' style='background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>

                      <!-- Header -->
                      <tr>
                        <td style='background-color:{headerColor};padding:28px 32px;'>
                          <h1 style='margin:0;color:#ffffff;font-size:22px;letter-spacing:0.5px;'>NexDesk</h1>
                          <p style='margin:4px 0 0;color:#bfdbfe;font-size:13px;'>Support Ticket System</p>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style='padding:32px;'>
                          <p style='margin:0 0 8px;font-size:15px;color:#374151;'>Hej <strong>{supporterName}</strong>,</p>
                          <p style='margin:0 0 24px;font-size:15px;color:#374151;'>{introText}</p>

                          <!-- Details table -->
                         <table width='100%' cellpadding='0' cellspacing='0' style='border-top:1px solid #e5e7eb;font-size:14px;'>
                            <tr>
                                <td style='padding:8px 0;color:#6b7280;width:140px;'>Ticket</td>
                                <td style='padding:8px 0;color:#374151;'><strong>{ticketTitle}</strong></td>
                            </tr>
                            {taskRow}
                            {createdByRow}
                            <tr style='border-top:1px solid #f3f4f6;'>
                                <td style='padding:8px 0;color:#6b7280;vertical-align:top;'>Beskrivelse</td>
                                <td style='padding:8px 0;color:#374151;'>{description}</td>
                            </tr>
                            <tr style='border-top:1px solid #f3f4f6;'>
                                <td style='padding:8px 0;color:#6b7280;'>Prioritet</td>
                                <td style='padding:8px 0;color:#374151;'>{priority}</td>
                            </tr>
                            {dueDateRow}
                        </table>

                          <!-- CTA Button -->
                          <div style='margin-top:28px;text-align:center;'>
                            <a href='{ticketUrl}' style='display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;'>
                              Åbn Ticket
                            </a>
                          </div>

                          <p style='margin:28px 0 0;font-size:13px;color:#9ca3af;text-align:center;'>
                            Hvis knappen ikke virker, kopier dette link:<br>
                            <a href='{ticketUrl}' style='color:#2563eb;'>{ticketUrl}</a>
                          </p>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style='background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;'>
                          <p style='margin:0;font-size:12px;color:#9ca3af;'>
                            Dette er en automatisk besked fra NexDesk. Svar venligst ikke på denne e-mail.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>";

            await SendAsync(to, subject, body);
        }


        // Sender en e-mail, når et ticket er blevet lukket. E-mailen indeholder detaljer om det lukkede ticket og eventuel feedback fra administratoren. E-mailens indhold og farvetema tilpasses afhængigt af om modtageren er kunden eller supporteren.
        public async Task SendTicketClosedAsync(
            string toEmail,
            string toName,
            string ticketTitle,
            int ticketId,
            string adminFeedback,
            bool isCustomer = false,
            string resolutionText = "")
        {
                var subject = $"Ticket #{ticketId} er nu lukket – {ticketTitle}";

                string bodyColor = isCustomer ? "#27ae60" : "#c0392b";
            string bodyIntro = isCustomer
             ? $"Kære bruger,<br>Din sag er nu behandlet og lukket af vores team."
             : $"Hej {toName},<br>Ticket #{ticketId} er nu markeret som lukket af administrator.";

            var body = $@"
                    <div style='font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;'>
                        <div style='background:{bodyColor};padding:24px;'>
                        <h2 style='color:#fff;margin:0;'>Ticket Lukket</h2>
                        <p style='color:#fff;margin:4px 0 0;opacity:0.85;'>#{ticketId} – {ticketTitle}</p>
                        </div>
                        <div style='padding:24px;background:#f9f9f9;'>
                        <p>{bodyIntro}</p>
                        <table style='width:100%;border-collapse:collapse;margin-top:12px;'>
                            <tr>
                            <td style='padding:8px;background:#fff;border:1px solid #eee;font-weight:bold;width:40%;'>Ticket</td>
                            <td style='padding:8px;background:#fff;border:1px solid #eee;'>#{ticketId} – {ticketTitle}</td>
                            </tr>
                            <tr>
                          <td style='padding:8px;background:#fff;border:1px solid #eee;font-weight:bold;'>Din sag</td>
                            <td style='padding:8px;background:#fff;border:1px solid #eee;'>{(string.IsNullOrWhiteSpace(adminFeedback) ? "Ikke angivet" : adminFeedback)}</td>
                            </tr>
                            <tr>
                            <td style='padding:8px;background:#fff;border:1px solid #eee;font-weight:bold;'>Løsningsbeskrivelse</td>
                            <td style='padding:8px;background:#fff;border:1px solid #eee;'>{(string.IsNullOrWhiteSpace(resolutionText) ? "Ikke angivet" : resolutionText)}</td>
                            </tr>
                        </table>
                        <p style='margin-top:20px;color:#888;font-size:0.85em;'>Dette er en automatisk besked fra NexDesk.</p>
                        </div>
                    </div>";

            await SendAsync(toEmail, subject, body);
        }
    }
}
