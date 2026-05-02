using NexDesk.Domain.Dtos.UserHandlingDto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.AuthHelper
{
    public class LoginResponse
    {
        public string Token { get; set; }
        public UserUpdateDto User { get; set; }
    }
}
