using NexDesk.Webform.Controllers.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using NexDesk.Domain.AuthHelper;

var builder = WebApplication.CreateBuilder(args);

var sessionTimer = SessionTimer.SessionTimeoutSeconds;
var sessionTimerByMin = sessionTimer / 60;

// -------------------- Data Protection Keys (persist across restarts) --------------------
var webformKeysPath = builder.Configuration["DataProtection:KeysPath"];
if (string.IsNullOrWhiteSpace(webformKeysPath))
{
    webformKeysPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
        "NexDesk",
        "DataProtectionKeys",
        "Webform");
}
Directory.CreateDirectory(webformKeysPath);

builder.Services
    .AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(webformKeysPath))
    .SetApplicationName("NexDesk.Webform");

// -------------------- Session --------------------
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(sessionTimerByMin);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// -------------------- HttpClient for API calls --------------------
builder.Services.AddHttpClient("NexDeskApi", client =>
{
    var apiBaseUrl = builder.Configuration["Api:BaseUrl"];
    if (string.IsNullOrWhiteSpace(apiBaseUrl))
        throw new Exception("Api:BaseUrl is missing in configuration.");

    client.BaseAddress = new Uri(apiBaseUrl);
});

// -------------------- Cookie Auth --------------------
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.HttpOnly = true;
        options.ExpireTimeSpan = TimeSpan.FromMinutes(sessionTimerByMin);
        options.SlidingExpiration = true;
        options.LoginPath = "/Login";

        options.Cookie.IsEssential = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;

        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.Name = "NexDeskWebformAuth";
        options.Cookie.MaxAge = null; 

        options.Events = new CookieAuthenticationEvents
        {
            OnRedirectToLogin = ctx =>
            {
                if (ctx.Request.Path.StartsWithSegments("/api"))
                {
                    ctx.Response.StatusCode = 401;
                    return Task.CompletedTask;
                }

                var returnUrl = Uri.EscapeDataString(ctx.Request.Path + ctx.Request.QueryString);
                ctx.Response.Redirect($"/session-expired?returnUrl={returnUrl}");
                return Task.CompletedTask;
            }
        };
    });

// MVC
builder.Services.AddControllersWithViews();

var app = builder.Build();

// Prod hardening
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

// IMPORTANT: Keep HTTP on port 86 working as HTTP (no redirect), but allow HTTPS normally.
app.UseWhen(
    ctx =>
    {
        var hostPort = ctx.Request.Host.Port;
        var localPort = ctx.Connection.LocalPort;
        return hostPort != 86 && localPort != 86;
    },
    branch => branch.UseHttpsRedirection()
);

app.UseStaticFiles();

app.UseRouting();

app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();