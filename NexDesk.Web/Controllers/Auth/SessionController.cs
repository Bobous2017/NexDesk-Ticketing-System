using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;

namespace NexDesk.Web.Controllers.Auth
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


        // This endpoint can be called by the client to keep the session alive (e.g., via JavaScript setInterval)
        [Authorize]
        [HttpPost("/Auth/KeepAlive")]
        public IActionResult KeepAlive()
        {
            return Ok();
        }

    }
}
