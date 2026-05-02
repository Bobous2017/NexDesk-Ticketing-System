using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.Dtos.UserHandlingDto
{
    public class UserSessionDto
    {
        public int Id { get; set; }
        public int? SessionTimeoutMinutes { get; set; }
    }
}
