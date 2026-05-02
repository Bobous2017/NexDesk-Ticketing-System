using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.Dtos.AttachmentDto
{
    public class AttachmentDto
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public int? ReportId { get; set; }
        public int UploadedByUserId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string UploadedByUserName { get; set; } = string.Empty;
        public string DownloadUrl { get; set; } = string.Empty;
    }
}
