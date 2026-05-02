using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexDesk.Webform.Models;
using System.Diagnostics;
using System.Security.Claims;
using NexDesk.Domain.Dtos.TicketsDto;

namespace NexDesk.Webform.Controllers
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
            _http = factory.CreateClient(); // Clients
            _config = config;
        }

        [Authorize]
        public IActionResult Index()
        {
            ViewData["Title"] = "Velkommen til NexDesk hos IT&Data Odense";
            ViewData["Breadcrumb"] = "Forside > Velkommen";
            var apiBase = _config["Api:BaseUrl"] ?? "";
            ViewData["ApiBaseUrl"] = apiBase;
            return View();
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
