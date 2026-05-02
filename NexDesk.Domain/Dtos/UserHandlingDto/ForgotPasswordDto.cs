using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.Dtos.UserHandlingDto
{
    public class ForgotPasswordDto
    {
        public string Email { get; set; } = string.Empty;

        // tells API which frontend should be used in the reset link
        public string? Client { get; set; } // "web" | "bruger" | "maui"
    }
}
