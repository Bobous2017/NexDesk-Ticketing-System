using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexDesk.Domain.Entities;
using NexDesk.Web.Models;
using System.Diagnostics;
using System.Text.Json;
using System.Threading.Tasks;

namespace NexDesk.Controllers
{
    public class HomeController : Controller
    {
        //----------------------------------------------- Declaring Privates variable for DI
        private readonly ILogger<HomeController> _logger;
        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        //----------------------------------------------- DI 
        public HomeController(
            ILogger<HomeController> logger,
            IHttpClientFactory factory,
            IConfiguration config)
        {
            _logger = logger;
            _http = factory.CreateClient("NexDeskApi"); // Call Client Api
            _config = config;
        }

       [Authorize] // comment this out during development
        public async Task<IActionResult> Index()
        {
            ViewData["Title"] = "Velkommen til NexDesk hos IT&Data Odense";
            ViewData["Breadcrumb"] = "Forside > Velkommen";
            var model = new DashboardVm();
            var loadedUsers = new List<UserVm>();
            
            try
            {
                var client = _http;
                //------------------------------ Users Call -----------------------------
                var usersResponse = await client.GetAsync("api/users");
                if (usersResponse.IsSuccessStatusCode)
                {
                    var usersJson = await usersResponse.Content.ReadAsStringAsync();
                    loadedUsers = JsonSerializer.Deserialize<List<UserVm>>(usersJson, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<UserVm>();
                    model.Users = loadedUsers;
                }
                else
                {
                    _logger.LogWarning("Users API failed with status code {StatusCode}", usersResponse.StatusCode);
                }
                //------------------------------ Dashboard API call to load the main dashboard stats  -----------------------------

                var response = await client.GetAsync("api/dashboard"); // <-- Call to Dashboard API
                var ticketsResponse = await client.GetAsync("api/tickets"); // <-- Call to Tickets API
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();

                    model = JsonSerializer.Deserialize<DashboardVm>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new DashboardVm();

                    if (model.Users == null || model.Users.Count == 0)
                    {
                        model.Users = loadedUsers;
                    }
                }
                else
                {
                    _logger.LogWarning("Dashboard API failed with status code {StatusCode}", response.StatusCode);
                }
                //---------------------------------- Load tickets for the recent activity section  -----------------------------

                if (ticketsResponse.IsSuccessStatusCode)
                {
                    var ticketsJson = await ticketsResponse.Content.ReadAsStringAsync();

                    var apiTickets = JsonSerializer.Deserialize<List<TicketApiVm>>(ticketsJson, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new();

                    model.Tickets = apiTickets.Select(t => new TicketListItemVm
                    {
                        Id = t.Id,
                        Title = t.Title,
                        Description = t.Description,
                        TicketCategoryId = t.TicketCategoryId,
                        CategoryName = t.TicketCategory?.Name ?? "-",
                        TicketPriorityId = t.TicketPriorityId,
                        PriorityName = t.TicketPriority?.Name ?? "-",
                        StatusId = t.StatusId,
                        StatusName = t.Status?.Name ?? "-",
                        TicketDepartmentId = t.TicketDepartmentId,
                        DepartmentName = t.TicketDepartment?.Name ?? "-",
                        AssignedToUserId = t.AssignedToUserId,
                        CreatedByUserId = t.CreatedByUserId,
                        DueDate = t.DueDate,
                        CreatedAt = t.CreatedAt,
                        AssignedToName = t.AssignedToUser != null
                            ? $"{t.AssignedToUser.FirstName} {t.AssignedToUser.LastName}".Trim()
                            : "Unassigned"
                    }).ToList();
                }
                else
                {
                    _logger.LogWarning("Tickets API failed with status code {StatusCode}", ticketsResponse.StatusCode);
                }


                //------------------------------ Notifications Call  -----------------------------
                var notificationsResponse = await client.GetAsync("api/notifications");

                if (notificationsResponse.IsSuccessStatusCode)
                {
                    var notificationsJson = await notificationsResponse.Content.ReadAsStringAsync();

                    model.Notifications = JsonSerializer.Deserialize<List<NotificationVm>>(notificationsJson, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<NotificationVm>();
                }
                else
                {
                    _logger.LogWarning("Notifications API failed with status code {StatusCode}", notificationsResponse.StatusCode);
                }

                //------------------------------ Lookups Call  -----------------------------
                var categoriesResponse = await client.GetAsync("api/ticketcategories");
                if (categoriesResponse.IsSuccessStatusCode)
                {
                    var json = await categoriesResponse.Content.ReadAsStringAsync();
                    model.TicketCategories = JsonSerializer.Deserialize<List<LookupItemVm>>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<LookupItemVm>();
                }

                var departmentsResponse = await client.GetAsync("api/ticketdepartments");
                if (departmentsResponse.IsSuccessStatusCode)
                {
                    var json = await departmentsResponse.Content.ReadAsStringAsync();
                    model.TicketDepartments = JsonSerializer.Deserialize<List<LookupItemVm>>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<LookupItemVm>();
                }

                var prioritiesResponse = await client.GetAsync("api/ticketpriorities");
                if (prioritiesResponse.IsSuccessStatusCode)
                {
                    var json = await prioritiesResponse.Content.ReadAsStringAsync();
                    model.TicketPriorities = JsonSerializer.Deserialize<List<LookupItemVm>>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<LookupItemVm>();
                }

                var statusesResponse = await client.GetAsync("api/ticketstatuses");
                if (statusesResponse.IsSuccessStatusCode)
                {
                    var json = await statusesResponse.Content.ReadAsStringAsync();
                    model.TicketStatuses = JsonSerializer.Deserialize<List<LookupItemVm>>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<LookupItemVm>();
                }


                //------------------------------ Comment calls  -----------------------------
                var commentsResponse = await client.GetAsync("api/comments");
                if (commentsResponse.IsSuccessStatusCode)
                {
                    var commentsJson = await commentsResponse.Content.ReadAsStringAsync();
                    model.Comments = JsonSerializer.Deserialize<List<CommentVm>>(commentsJson, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<CommentVm>();
                }
                else
                {
                    _logger.LogWarning("Comments API failed with status code {StatusCode}", commentsResponse.StatusCode);
                }

                //------------------------------ history calls  -----------------------------
                var historyResponse = await client.GetAsync("api/history");
                if (historyResponse.IsSuccessStatusCode)
                {
                    var historyJson = await historyResponse.Content.ReadAsStringAsync();
                    model.History = JsonSerializer.Deserialize<List<HistoryVm>>(historyJson, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<HistoryVm>();
                }
                else
                {
                    _logger.LogWarning("History API failed with status code {StatusCode}", historyResponse.StatusCode);
                }

                // ------------------------------ Report calls  -----------------------------
                var reportsResponse = await client.GetAsync("api/reports");

                if (reportsResponse.IsSuccessStatusCode)
                {
                    var reportsJson = await reportsResponse.Content.ReadAsStringAsync();

                    model.Reports = JsonSerializer.Deserialize<List<ReportVm>>(reportsJson, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<ReportVm>();
                }
                else
                {
                    _logger.LogWarning("Reports API failed with status code {StatusCode}", reportsResponse.StatusCode);
                }

                // ------------------------------ Tasks calls  -----------------------------
                var tasksResponse = await client.GetAsync("api/tasks");
                if (tasksResponse.IsSuccessStatusCode)
                {
                    var tasksJson = await tasksResponse.Content.ReadAsStringAsync();
                    model.Tasks = JsonSerializer.Deserialize<List<TaskVm>>(tasksJson, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<TaskVm>();
                }
                else
                {
                    _logger.LogWarning("Tasks API failed with status code {StatusCode}", tasksResponse.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while loading dashboard data.");
            }
            ViewData["ApiBaseUrl"] = _config["Api:PublicUrl"] ?? _config["Api:BaseUrl"] ?? "";
            return View(model);
        }


        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
