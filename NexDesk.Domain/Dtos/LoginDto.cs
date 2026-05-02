using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.Dtos
{
    public class LoginDto
    {
        public string? UserName { get; set; }
        public string? PassWord { get; set; }
        public string? RfidChip { get; set; }
        public string? SelectedRole { get; set; }
    }
}
