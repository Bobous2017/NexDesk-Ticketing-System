using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.Entities
{
    public class TicketCategory
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
    }

}
