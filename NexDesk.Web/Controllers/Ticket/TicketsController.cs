using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexDesk.Domain.Dtos;
using NexDesk.Domain.Entities;
using NexDesk.Domain.Entities.Task;
using NexDesk.Web.Models;
using System.Net.Http.Json;

namespace NexDesk.Web.Controllers.Ticket
{
    [Authorize(Policy = "RequireSupport")]
    public class TicketsController : Controller
    {
        private readonly IHttpClientFactory _http;
        public TicketsController(IHttpClientFactory http) => _http = http;

        private HttpClient Api() => _http.CreateClient("NexDeskApi");

        //---------------------------------------- GET: /Tickets
        [HttpGet]
        public async Task<IActionResult> Index()
        {
            var tickets = await Api().GetFromJsonAsync<List<TicketVm>>("api/tickets") ?? new();
            return View(tickets);
        }

        //---------------------------------------- GET: /Tickets/Create
        [Authorize(Policy = "RequireAdmin")]
        [HttpGet]
        public IActionResult Create() => View();

        //---------------------------------------- POST: /Tickets/Create
        [Authorize(Policy = "RequireAdmin")]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(TicketVm model)
        {
            var response = await Api().PostAsJsonAsync("api/tickets", model);
            if (response.IsSuccessStatusCode) return RedirectToAction(nameof(Index));
            ModelState.AddModelError("", "Failed to create ticket.");
            return View(model);
        }

        //---------------------------------------- GET: /Tickets/Update/5
        [HttpGet]
        public async Task<IActionResult> Update(int id)
        {
            var ticket = await Api().GetFromJsonAsync<TicketVm>($"api/tickets/{id}");
            if (ticket == null) return NotFound();

            // Support can only update their assigned tickets
            if (User.FindFirst("PermissionLevel")?.Value == "2")
            {
                var userName = User.Identity?.Name;
                if (ticket.AssignedToName != userName)
                    return Forbid();
            }

            ViewBag.Tasks = await LoadTasksForTicketAsync(id);
            return View(ticket);
        }

        //---------------------------------------- POST: /Tickets/Update/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Update(int id, TicketVm model)
        {
            var response = await Api().PutAsJsonAsync($"api/tickets/{id}", model);
            if (response.IsSuccessStatusCode) return RedirectToAction(nameof(Index));
            ModelState.AddModelError("", "Failed to update ticket.");

            ViewBag.Tasks = await LoadTasksForTicketAsync(id);
            return View(model);
        }

        //---------------------------------------- POST: /Tickets/AddTask
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddTask(int ticketId, string title, string? description, DateTime? dueDate)
        {
            if (ticketId <= 0)
                return BadRequest();

            if (string.IsNullOrWhiteSpace(title))
            {
                TempData["TaskError"] = "Task title is required.";
                return RedirectToAction(nameof(Update), new { id = ticketId });
            }

            var createdByClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            int? createdByUserId = int.TryParse(createdByClaim, out var parsedUserId) ? parsedUserId : null;

            var payload = new NexDesk.Domain.Entities.Task.TicketTask
            {
                TicketId = ticketId,
                Title = title.Trim(),
                Description = description?.Trim() ?? string.Empty,
                StatusId = 1,
                DueDate = dueDate,
                CreatedByUserId = createdByUserId,
                AssignedUserId = createdByUserId
            };

            var response = await Api().PostAsJsonAsync("api/tasks", payload);
            if (!response.IsSuccessStatusCode)
            {
                TempData["TaskError"] = "Failed to create task.";
            }

            return RedirectToAction(nameof(Update), new { id = ticketId });
        }

        //---------------------------------------- GET: /Tickets/Delete/5
        [Authorize(Policy = "RequireAdmin")]
        [HttpGet]
        public async Task<IActionResult> Delete(int id)
        {
            var ticket = await Api().GetFromJsonAsync<TicketVm>($"api/tickets/{id}");
            return ticket == null ? NotFound() : View(ticket);
        }

        //---------------------------------------- POST: /Tickets/Delete/5
        [Authorize(Policy = "RequireAdmin")]
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            await Api().DeleteAsync($"api/tickets/{id}");
            return RedirectToAction(nameof(Index));
        }

        private async Task<List<TicketTask>> LoadTasksForTicketAsync(int ticketId)
        {
            var tasks = await Api().GetFromJsonAsync<List<TicketTask>>("api/tasks") ?? new();
            return tasks.Where(t => t.TicketId == ticketId).ToList();
        }
    }
}