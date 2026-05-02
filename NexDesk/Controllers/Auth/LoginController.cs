using NexDesk.Domain.Dtos.UserHandlingDto;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexDesk.Domain.AuthHelper;
using NexDesk.Domain.Dtos;
using System.Security.Claims;

namespace NexDesk.Web.Controllers.Auth
{
    public class LoginController : Controller
    {
        private readonly IHttpClientFactory _http;
        private readonly IConfiguration _config;
        private readonly ILogger<LoginController> _logger;

        public LoginController(IHttpClientFactory http, IConfiguration config, ILogger<LoginController> logger)
        {
            _http = http;
            _config = config;
            _logger = logger;
        }


        //--------------------------------------------- GET: in web page for Index
        [HttpGet]
        public IActionResult Index()
        {
            return View(new LoginDto());
        }

        //--------------------------------------------- POST: in web page for Login :  api/auth/login-rfid +  api/auth/login
        [HttpPost]
        public async Task<IActionResult> Login(LoginDto model)
        {
            var client = _http.CreateClient("NexDeskApi");
            HttpResponseMessage response;

            try
            {
                // Admin login: requires username + password + RFID
                if (model.SelectedRole == "admin")
                {
                    if (string.IsNullOrWhiteSpace(model.UserName) ||
                        string.IsNullOrWhiteSpace(model.PassWord) ||
                        string.IsNullOrWhiteSpace(model.RfidChip))
                    {
                        ModelState.AddModelError("", "Udfyld brugernavn, adgangskode og RFID.");
                        ViewData["SelectedRole"] = "admin";
                        return View("Index", model);
                    }
                    model.PassWord = PasswordHelper.Hash(model.PassWord);
                    response = await client.PostAsJsonAsync("api/auth/login", model);
                }
                else
                {
                    // Support login: only username + password, RFID must be null
                    if (string.IsNullOrWhiteSpace(model.UserName) ||
                        string.IsNullOrWhiteSpace(model.PassWord))
                    {
                        ModelState.AddModelError("", "Udfyld brugernavn og adgangskode.");
                        ViewData["SelectedRole"] = "support";
                        return View("Index", model);
                    }
                    model.PassWord = PasswordHelper.Hash(model.PassWord);
                    model.RfidChip = null; // Ensure RFID is never sent for Support - API will skip RFID check
                    response = await client.PostAsJsonAsync("api/auth/login", model);
                }

                // Login success: build claims and sign in
                if (response.IsSuccessStatusCode)
                {
                    var loginResult = await response.Content.ReadFromJsonAsync<LoginResponse>();
                    if (loginResult?.User == null || string.IsNullOrWhiteSpace(loginResult.Token))
                    {
                        _logger.LogWarning("Login API returned success but missing token/user payload.");
                        ModelState.AddModelError("", "Login failed due to an invalid server response. Please try again.");
                        ViewData["SelectedRole"] = model.SelectedRole == "admin" ? "admin" : "support";
                        return View("Index", model);
                    }

                    var user = loginResult.User;

                    // Save JWT in session
                    HttpContext.Session.SetString("JwtToken", loginResult.Token);


                    var timeout = user.SessionTimeoutMinutes ?? SessionTimer.SessionTimeoutSeconds / 60; // Grab  session  per User
                    var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.UserName ?? user.Email),
                    new Claim(ClaimTypes.Email, user.Email ?? ""),
                    new Claim(ClaimTypes.Role, user.RoleName ?? "User"),
                    new Claim("JwtToken", loginResult.Token),
                    new Claim("SessionTimeoutSeconds", (timeout * 60).ToString()),
                    new Claim("PermissionLevel", user.PermissionLevel.ToString()),
                };

                    var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                

                    var authProperties = new AuthenticationProperties
                {
                    IsPersistent = false,
                    ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(timeout)
                };

                    await HttpContext.SignInAsync(
                        CookieAuthenticationDefaults.AuthenticationScheme,
                        new ClaimsPrincipal(identity),
                        authProperties);

                    TempData["ShowWelcome"] = true; // Show welcome message on home page
                    return RedirectToAction("Index", "Home");
                }

                // Login failed: show safe error and restore the correct tab
                var errorMessage = await response.Content.ReadAsStringAsync();
                var contentType = response.Content.Headers.ContentType?.MediaType;
                var isHtmlError = !string.IsNullOrWhiteSpace(contentType) &&
                                  contentType.Contains("html", StringComparison.OrdinalIgnoreCase);

                _logger.LogWarning("Login API returned status {StatusCode}. ContentType: {ContentType}",
                    (int)response.StatusCode,
                    contentType ?? "unknown");

                var safeMessage = response.StatusCode == System.Net.HttpStatusCode.Unauthorized
                    ? (string.IsNullOrWhiteSpace(errorMessage) ? "Invalid credentials." : errorMessage)
                    : (isHtmlError || (int)response.StatusCode >= 500
                        ? "Login service is unavailable right now. Please contact IT."
                        : (string.IsNullOrWhiteSpace(errorMessage) ? "Login failed." : errorMessage));

                ModelState.AddModelError("", safeMessage);
                ViewData["SelectedRole"] = !string.IsNullOrWhiteSpace(model.RfidChip) ? "admin" : "support"; // To avoid the swapping back to Support
                return View("Index", model);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Login request to API failed. Base URL: {ApiBaseUrl}", _config["Api:BaseUrl"]);
                ModelState.AddModelError("", "Cannot reach login service right now. Please contact IT.");
                ViewData["SelectedRole"] = model.SelectedRole == "admin" ? "admin" : "support";
                return View("Index", model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected login error.");
                ModelState.AddModelError("", "Unexpected error during login. Please try again.");
                ViewData["SelectedRole"] = model.SelectedRole == "admin" ? "admin" : "support";
                return View("Index", model);
            }
        }
        //--------------------------------------------- POST: in web page for Logout : RedirectToAction("Index", "Login")
        [HttpPost]
        public async Task<IActionResult> Logout()
        {
            //await HttpContext.SignOutAsync();
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            HttpContext.Session.Clear();
            return RedirectToAction("Index", "Login");
        }



        //-------------------------------------------- POST: submit new password : api/auth/reset-password
        [HttpPost]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto model)
        {
            if (model.NewPassword != model.RepeatPassword)
            {
                ModelState.AddModelError("", "Passwords do not match");
                return View(model);
            }

            var client = _http.CreateClient("NexDeskApi");

            var response = await client.PostAsJsonAsync(
                "api/auth/reset-password",
                model
            );

            if (!response.IsSuccessStatusCode)
            {
                ModelState.AddModelError("", "Invalid or expired code");
                return View(model);
            }

            TempData["SuccessMessage"] = "Adgangskode nulstillet! Du kan nu logge ind.";
            return RedirectToAction("Index", "Login");
        }


        //--------------------------------------------- GET: in web page for ResetPassword, Grab token
        [AllowAnonymous]
        [HttpGet]
        public IActionResult ResetPassword(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return BadRequest();

            return View(new ResetPasswordDto { Token = token });
        }


        
    }
}
