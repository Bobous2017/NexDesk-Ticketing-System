using NexDesk.Web.Controllers.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using NexDesk.Domain.AuthHelper;

var builder = WebApplication.CreateBuilder(args);

// -------------------- Data Protection Keys --------------------
var adminKeysPath = builder.Configuration["DataProtection:KeysPath"];
if (string.IsNullOrWhiteSpace(adminKeysPath))
{
    adminKeysPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
        "NexDesk",
        "DataProtectionKeys",
        "AdminWeb");
}
Directory.CreateDirectory(adminKeysPath);

builder.Services
    .AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(adminKeysPath))
    .SetApplicationName("NexDesk.AdminWeb");

// -------------------- Session --------------------
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(24);
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
        options.ExpireTimeSpan = TimeSpan.FromHours(24);
        options.SlidingExpiration = true;
        options.LoginPath = "/Login";

        options.Cookie.IsEssential = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;

        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.Name = "NexDeskAdminAuth";
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

// Authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", p => p.RequireClaim("PermissionLevel", "3"));
    options.AddPolicy("RequireSupport", p => p.RequireClaim("PermissionLevel", "2", "3"));
});

builder.Services.AddControllersWithViews();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}


// IMPORTANT: Keep HTTP on port 80 working as HTTP (no redirect), but allow HTTPS normally.
app.UseWhen(
    ctx =>
    {
        var hostPort = ctx.Request.Host.Port;
        var localPort = ctx.Connection.LocalPort;
        return hostPort != 80 && localPort != 80;
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

app.MapFallbackToController("Index", "Home");

app.Run();