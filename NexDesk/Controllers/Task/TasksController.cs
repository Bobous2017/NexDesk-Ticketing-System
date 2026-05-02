using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexDesk.Domain.Entities.Task;
using System.Net.Http.Json;

namespace NexDesk.Web.Controllers.Task
{
    [Authorize(Roles = "Admin,Support")]
    public class TasksController : Controller
    {
        private readonly IHttpClientFactory _http;

        public TasksController(IHttpClientFactory http) => _http = http;

        private HttpClient Api() => _http.CreateClient("NexDeskApi");

        [HttpGet]
        public async Task<IActionResult> Index()
        {
            var tasks = await Api().GetFromJsonAsync<List<TicketTask>>("api/tasks") ?? new();
            return View(tasks);
        }
    }
}
