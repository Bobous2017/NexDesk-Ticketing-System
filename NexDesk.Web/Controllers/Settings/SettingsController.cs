using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexDesk.Domain.Dtos.UserHandlingDto;
using System.Security.Claims;
using static System.Net.WebRequestMethods;

namespace NexDesk.Web.Controllers.Settings
{
    [Authorize]
    public class SettingsController : Controller
    {
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _http; 

        public SettingsController(IConfiguration config, IHttpClientFactory http)
        {
            _config = config;
            _http = http; 
        }

        [HttpGet] //--------------------------------------------- GET: in button  for Settings
        public IActionResult Index()
        {
            var apiBase = _config["Api:PublicUrl"] ?? _config["Api:BaseUrl"] ?? "";
            Console.WriteLine($"Api:BaseUrl = '{apiBase}'"); // ← check terminal output
            ViewData["ApiBaseUrl"] = apiBase;
            return View("Settings");
        }

        //-------------------------------------------- POST: send a link  to email : api/auth/forgot-password
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SendResetLink()
        {
            var email = User?.Claims?.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;

            // If your JWT doesn't include Email claim, you must lookup email via API by username (next step).
            if (string.IsNullOrWhiteSpace(email))
            {
                TempData["Err"] = "Email claim missing. Add ClaimTypes.Email in token OR lookup user email via API.";
                return RedirectToAction(nameof(Index));
            }

            var client = _http.CreateClient("NexDeskApi");
            var resp = await client.PostAsJsonAsync("api/auth/forgot-password", new ForgotPasswordDto { Email = email, Client = "admin" });

            TempData["Ok"] = resp.IsSuccessStatusCode
                ? "Link og kode er sendt til din email."
                : "Kunne ikke sende reset link.";

            return RedirectToAction(nameof(Index));
        }
    }
}
