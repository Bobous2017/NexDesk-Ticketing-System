using Microsoft.AspNetCore.Http;

namespace NexDesk.Webform.Models;

public class IndexModel
{
    public TicketInputModel Ticket { get; set; } = new();
    public List<IFormFile> Files { get; set; } = new();
}

public class TicketInputModel
{
    public string? OpgaveTitle { get; set; }
    public string? OpgaveDescription { get; set; }
    public string? Department { get; set; }
    public string? Mail { get; set; }
    public string? Kategori { get; set; }
}
