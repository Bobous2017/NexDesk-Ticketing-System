using System.ComponentModel.DataAnnotations.Schema;

namespace NexDesk.Domain.Entities
{
    public class User
    {
        public int Id { get; set; }
        public int RoleId { get; set; }

        [System.Text.Json.Serialization.JsonIgnore]
        public Role? Role { get; set; }

        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string UserName { get; set; } = null!;
        public string? PassWord { get; set; }
        public string Email { get; set; } = null!;
        public string? Phone { get; set; }
        public string? RfidChip { get; set; }
        // Password Reset
        public DateTime? PasswordResetTokenExpiry { get; set; }
        public string? PasswordResetToken { get; set; }

        // Password Reset OTP (6 digits) = One-Time Password for added security
        public string? PasswordResetOtp { get; set; }
        public DateTime? PasswordResetOtpExpiry { get; set; }

        //[NotMapped]//  tells Entity Framework "this property exists in C# but do NOT create a column for it in the database."
        public int? SessionTimeoutMinutes { get; set; }// It's just a temporary carrier — the value travels through the API request but never gets saved to the Users table. It gets saved to UserProfiles table instead, which is where SessionTimeoutMinutes actually belongs.

        //public virtual UserProfile UserProfile { get; set; } // Triggers 
    }
}
