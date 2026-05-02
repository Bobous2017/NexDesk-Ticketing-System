using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using System.Security.Claims;


namespace NexDesk.Webform.Controllers
{
    public class TicketsController : Controller
    {
        private readonly IHttpClientFactory _http;
        private readonly ILogger<TicketsController> _logger;

        public TicketsController(IHttpClientFactory http, ILogger<TicketsController> logger)
        {
            _http = http;
            _logger = logger;
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([FromBody] TicketCreateDto model)
        {
            try
            {
                var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdValue, out var userId))
                {
                    _logger.LogWarning("Unauthorized attempt to create a ticket.");
                    return Unauthorized(new { message = "User is not logged in." });
                }

                model.CreatedByUserId = userId;

                var client = _http.CreateClient("NexDeskApi");

                var response = await client.PostAsJsonAsync("api/tickets", model);
                var body = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                    return Ok(body);

                _logger.LogError("API Error creating ticket. Status: {StatusCode}, Body: {Body}", response.StatusCode, body);

                // If it's not JSON, wrap it in a JSON object for the frontend
                return StatusCode((int)response.StatusCode, new { error = "API Error", details = body });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating ticket.");
                return StatusCode(500, new { error = "Internal server error occurred.", details = ex.Message });
            }
        }
    }

    public class TicketCreateDto
    {
        public int CreatedByUserId { get; set; }
        public int? AssignedToUserId { get; set; }
        public int TicketCategoryId { get; set; }
        public int TicketPriorityId { get; set; }
        public int StatusId { get; set; }
        public int TicketDepartmentId { get; set; }
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public string? Mail { get; set; } // Added to capture email if needed
        public DateTime? DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public bool IsActive { get; set; } = true;
    }
}