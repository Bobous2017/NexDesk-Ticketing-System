using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.Entities
{
    public class UserProfile
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public bool IsActive { get; set; } = false;
        public DateTime? LastLoginAt { get; set; }
        public string? ProfilePicture { get; set; }

        public int? SessionTimeoutMinutes { get; set; }
    }
}
