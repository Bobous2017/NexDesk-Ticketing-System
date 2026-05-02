using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.Entities
{
    public class ReportEmailLog
    {
        public int Id { get; set; }
        public int ReportId { get; set; }
        public string SentToEmail { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
        public Report? Report { get; set; }
    }
}