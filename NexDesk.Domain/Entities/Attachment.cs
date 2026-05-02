using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.Entities
{
    public class Attachment
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public int? ReportId { get; set; }
        public int UploadedByUserId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public Ticket? Ticket { get; set; }
        public User? UploadedByUser { get; set; }
    }
}
