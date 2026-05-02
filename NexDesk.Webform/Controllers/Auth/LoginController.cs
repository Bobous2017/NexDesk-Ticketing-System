using NexDesk.Domain.Dtos.UserHandlingDto;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexDesk.Domain.AuthHelper;
using NexDesk.Domain.Dtos;
using NexDesk.Domain.Dtos.UserHandlingDto;
using NexDesk.Domain.Dtos.UserHandlingDto;
using System.Security.Claims;
using System.Text;

namespace NexDesk.Webform.Controllers.Auth
{
    public class LoginController : Controller
    {
        private readonly IHttpClientFactory _http;

        public LoginController(IHttpClientFactory http)
        {
            _http = http;
        }


        //--------------------------------------------- GET: in web page for Index
        [HttpGet]
        public IActionResult Index()
        {
            return View(new LoginDto());
        }

        //-------------------------------------------------- Login for Webformular: username OR email + password (NO RFID) --POST /api/auth/loginBruger
        [HttpPost]
        public async Task<IActionResult> Login(LoginDto model)
        {
            // Manual validation: username + password only
            if (string.IsNullOrWhiteSpace(model.UserName) || string.IsNullOrWhiteSpace(model.PassWord))
            {
                ModelState.AddModelError("", "Udfyld brugernavn og adgangskode.");
                return View("Index", model);
            }

            var client = _http.CreateClient("NexDeskApi");

            // Hash password before sending to API
            model.PassWord = PasswordHelper.Hash(model.PassWord);

            // Call normal login endpoint only
            var response = await client.PostAsJsonAsync("api/auth/loginBruger", model);

            if (response.IsSuccessStatusCode)
            {
                var loginResult = await response.Content.ReadFromJsonAsync<LoginResponse>();
                var user = loginResult.User;

                // save JWT somewhere (cookie/session)
                HttpContext.Session.SetString("JwtToken", loginResult.Token);

                // create claims (still cookies for MVC auth)
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.UserName ?? user.Email),
                    new Claim(ClaimTypes.Email, user.Email ?? ""),
                    new Claim(ClaimTypes.Role,
                                            user.PermissionLevel == 3 ? "Administrator" :
                                            user.PermissionLevel == 2 ? "Support" : "User"),
                    new Claim("JwtToken", loginResult.Token),
                    new Claim("PermissionLevel", user.PermissionLevel.ToString())
                };

                var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                var principal = new ClaimsPrincipal(identity);

                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);

                TempData["ShowWelcome"] = true;  // Set TempData  for Hello message
                return RedirectToAction("Index", "Home");
            }


            // Read error message from API
            var errorMessage = await response.Content.ReadAsStringAsync();
            ModelState.AddModelError("", errorMessage);
            return View("Index", model);
        }
       
        
        //--------------------------------------------- POST: in web page for Logout : RedirectToAction("Index", "Login")
        [HttpPost]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            HttpContext.Session.Clear();
            //await HttpContext.SignOutAsync();
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
