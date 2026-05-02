using Microsoft.AspNetCore.Mvc;
using System;

namespace NexDesk.Webform.Controllers.Auth
{
    public class SessionController : Controller
    {
        //--------------------------------------------- Route: api/session-expired  :  return to : Action("Index", "Home")
        [HttpGet("/session-expired")]
        public IActionResult Expired(string? returnUrl = null)
        {
            ViewBag.ReturnUrl = returnUrl ?? Url.Action("Index", "Home");
            return View(); // Views/Session/Expired.cshtml
        }
    }
}
