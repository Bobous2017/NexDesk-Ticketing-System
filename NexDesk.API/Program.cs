using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NexDesk.Domain;
using NexDesk.Domain.Entities;
using NexDesk.Domain.IServices;
using NexDesk.Infrastructure;
using NexDesk.Infrastructure.DatabaseProviders;
using NexDesk.Infrastructure.Services;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// --------------------------------------------- JWT Auth -----------------------------------------------------------
var jwtConfig = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtConfig["Key"] ?? throw new Exception("Jwt:Key is missing in configuration."));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),

        ValidateIssuer = true,
        ValidIssuer = jwtConfig["Issuer"],

        ValidateAudience = true,
        ValidAudience = jwtConfig["Audience"],

        ValidateLifetime = true,
        RoleClaimType = ClaimTypes.Role
    };
});

// --------------------------------------------- Database Provider Switch ------------------------------------------
var providerName = builder.Configuration["DatabaseProvider"];

IDatabaseProvider dbProvider = providerName switch
{
    "SqlServer" => new SqlServerProvider(builder.Configuration.GetConnectionString("SqlServer")!),
    "SQLite" => new SqliteProvider(builder.Configuration.GetConnectionString("SQLite")!),
    "WindowsServer" => new SqlServerProvider(builder.Configuration.GetConnectionString("WindowsServer")!),
    _ => throw new Exception($"Unknown DatabaseProvider: '{providerName}'. Check appsettings.json.")
};

builder.Services.AddDbContext<NexDeskDbContext>(options => dbProvider.Configure(options));

// --------------------------------------------- Data Protection ---------------------------------------------------
// Persist keys to file system to avoid 'ephemeral repository' warnings and invalidation of grants on IIS restart.
var keysPath = Path.Combine(builder.Environment.ContentRootPath, "App_Data", "Keys");
if (!Directory.Exists(keysPath)) Directory.CreateDirectory(keysPath);
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(keysPath))
    .SetApplicationName("NexDesk");

// --------------------------------------------- Named HttpClient --------------------------------------------------
builder.Services.AddHttpClient("NexDeskApi", client =>
{
    var baseAddress = builder.Configuration["Api:BaseUrl"];
    if (!string.IsNullOrWhiteSpace(baseAddress))
        client.BaseAddress = new Uri(baseAddress);
    client.Timeout = TimeSpan.FromSeconds(30);
})
.ConfigureHttpMessageHandlerBuilder(builder =>
{
    var socketHandler = new SocketsHttpHandler
    {
        AutomaticDecompression = System.Net.DecompressionMethods.GZip | System.Net.DecompressionMethods.Deflate,
        PooledConnectionLifetime = TimeSpan.FromMinutes(2),
        PooledConnectionIdleTimeout = TimeSpan.FromSeconds(30)
    };
    builder.PrimaryHandler = socketHandler;
});

// --------------------------------------------- Dependency Injection Services -------------------------------------
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// --------------------------------------------- Controllers + Swagger ----------------------------------------------
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --------------------------------------------- Health Checks (so /api/health exists) ------------------------------
builder.Services.AddHealthChecks();

// --------------------------------------------- CORS ---------------------------------------------------------------
var frontendUrls = builder.Configuration
    .GetSection("Api:FrontendUrls")
    .Get<string[]>();

if (frontendUrls == null || frontendUrls.Length == 0)
{
    frontendUrls = Array.Empty<string>();
    Console.WriteLine("WARNING: Api:FrontendUrls is missing. Falling back to permissive CORS policy.");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (frontendUrls.Length == 0)
        {
            policy
                .AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();

        }
        else
        {
            policy
                .WithOrigins(frontendUrls)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    });
});

// --------------------------------------------- Build app ---------------------------------------------------------
var app = builder.Build();

// --------------------------------------------- Swagger (Dev only) ------------------------------------------------
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "NexDesk API v1");
    });
}

// IMPORTANT: Make HTTP :5093 work without redirect, while keeping HTTPS redirection elsewhere.
app.UseWhen(
    context =>
    {
        var hostPort = context.Request.Host.Port;        
        var localPort = context.Connection.LocalPort;     

        return hostPort != 5093 && localPort != 5093;
    },
    branch =>
    {
        branch.UseHttpsRedirection();
    }
);

app.UseStaticFiles();

app.UseRouting();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/api/health");

app.MapControllers();

if (app.Environment.IsDevelopment())
{
    var clientName = System.Security.Principal.WindowsIdentity.GetCurrent().Name;

    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;

    try
    {
        var context = services.GetRequiredService<NexDeskDbContext>();
        var connectionString = context.Database.GetDbConnection().ConnectionString;

        Console.WriteLine("--------------------------------------------------");
        Console.WriteLine($"DB Connection: {connectionString}");

        if (context.Database.CanConnect())
        {
            var tableNames = context.Model.GetEntityTypes()
                .Select(t => t.GetTableName())
                .Distinct()
                .ToList();

            Console.WriteLine("--------------------------------------------------");
            Console.WriteLine($"OS user account running the process: {clientName}");
            Console.WriteLine("--------------------------------------------------");
            Console.WriteLine("DB Status: Successfully connected to NexDeskDb.");
            Console.WriteLine($"Total Tables Found: {tableNames.Count}");
            Console.WriteLine("Table List:");

            foreach (var name in tableNames)
                Console.WriteLine($"  - {name}");

            Console.WriteLine("--------------------------------------------------");
            Console.WriteLine("If you don't see tables you expect, register them in NexDesk.Infrastructure NexDeskDbContext.");
        }
        else
        {
            Console.WriteLine("DB Status: Could NOT connect to the database.");
            Console.WriteLine("--------------------------------------------------");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"DB Error: {ex.Message}");
    }
}

if (builder.Configuration["DatabaseProvider"] == "SQLite")
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<NexDeskDbContext>();
    SeedData.Seed(db);
}

app.Run();