using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.Dtos.UserHandlingDto
{
    public sealed class UserLookupDto
    {
        public int Id { get; set; }
        public string? UserName { get; set; }
    }
}
