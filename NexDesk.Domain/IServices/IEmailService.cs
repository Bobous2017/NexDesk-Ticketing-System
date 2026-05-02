using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.IServices
{
    public interface IEmailService
    {
        Task SendPasswordResetAsync(string toEmail, string userName, string otpCode, string resetLink); // For reset password emails, we want to send an email with the OTP code and a link to reset the password.
        Task SendAsync(string to, string subject, string body, Stream? attachment = null, string? attachmentName = null); // For reset password emails, we want to be able to send an email with an optional attachment (the QR code image).

        Task SendTicketAssignedAsync(string to, string supporterName, int ticketId, string ticketTitle, string description, string priority, string? dueDate, string ticketUrl, string? taskTitle = null, string? createdByName = null); // For ticket assignment tilder til Supporter, we want to send an email with details about the ticket and a link to view it in the system.

        Task SendTicketClosedAsync(
          string toEmail,
          string toName,
          string ticketTitle,
          int ticketId,
          string adminFeedback,
          bool isCustomer = false,
          string resolutionText = ""); // For ticket closure, we want to send an email to the user who created the ticket (and optionally to the supporter) with details about the closed ticket and any feedback from the admin.
   
    }


}
