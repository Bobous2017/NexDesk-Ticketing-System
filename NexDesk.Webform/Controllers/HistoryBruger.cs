using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexDesk.Domain.Dtos.TicketsDto;
using NexDesk.Webform.Models;
using System.Net.Http.Json;
using System.Security.Claims;

namespace NexDesk.Webform.Controllers
{
    [Authorize]
    public class HistoryBrugerController : Controller
    {
        private readonly IHttpClientFactory _factory;

        public HistoryBrugerController(IHttpClientFactory factory)
        {
            _factory = factory;
        }

        public async Task<IActionResult> Index()
        {
            var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdValue, out var userId))
                return RedirectToAction("Index", "Login");

            var client = _factory.CreateClient("NexDeskApi");

            var tickets = await client.GetFromJsonAsync<List<TicketDto>>($"api/tickets/by-user/{userId}");

            var model = tickets?.Select(t => new TicketHistoryVm
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                CategoryName = t.TicketCategory?.Name ?? "",
                PriorityName = t.TicketPriority?.Name ?? "",
                StatusName = t.Status?.Name ?? "",
                DepartmentName = t.TicketDepartment?.Name ?? "",
                CreatedAt = t.CreatedAt,
                ClosedAt = t.ClosedAt,
                ResolutionText = t.ResolutionText
            }).ToList() ?? new List<TicketHistoryVm>();

            return View(model);
        }
    }
}