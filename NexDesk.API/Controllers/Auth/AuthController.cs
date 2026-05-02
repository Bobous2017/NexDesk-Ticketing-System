using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NexDesk.Domain.AuthHelper;
using NexDesk.Domain.Dtos;
using NexDesk.Domain.Dtos.UserHandlingDto;
using NexDesk.Domain.Entities;
using NexDesk.Domain.IServices;
using NexDesk.Infrastructure;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace NexDesk.API.Controllers.Auth
{
    [ApiController]
    [Route("api/auth")] // http://ipAddress:port/api/auth
    public class AuthController : ControllerBase
    {
        private readonly NexDeskDbContext _db;
        private readonly IConfiguration _config;
        private readonly IEmailService _email; // Inject email service
        public AuthController(NexDeskDbContext db, IConfiguration config, IEmailService email)
        {
            _db = db;
            _config = config;
            _email = email;
        }
        //-------------------------------------------------- Static dictionary to track login attempts per IP
        public static Dictionary<string, (int Count, DateTime LastAttempt)> LoginAttempts = new();

        private const int MAX_ATTEMPTS = 3; // Max attempts before cooldown
        private static readonly TimeSpan COOLDOWN = TimeSpan.FromMinutes(1);
        private static bool? _isUserProfilesTableAvailable;

        [Authorize]
        [HttpGet]  //--------------------------------------- POST: api/auth/
        public IActionResult GetSecureData()
        {
            return Ok("Only authorized users see this");
        }

        //--------------------------------------------------- Login  writting inputs Brugername  and Password - Lgin for NexDeskWeb  and Maui POST /api/auth/login

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto dto)
        {
            // Get client IP (you can customize this if behind reverse proxy)
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            // Check rate limit
            if (LoginAttempts.TryGetValue(ip, out var info))
            {
                if (info.Count >= MAX_ATTEMPTS && DateTime.UtcNow - info.LastAttempt < COOLDOWN)
                {
                    return Unauthorized("3x attempts"); // Besked  key til Razor at vise countdown
                }
            }

            // Authenticate user
            var user = _db.Users
            .Include(u => u.Role)
            .FirstOrDefault(u =>
                (u.UserName == dto.UserName || u.Email == dto.UserName) &&
                u.PassWord == dto.PassWord);

            if (user == null)
            {
                // Record failed attempt
                if (!LoginAttempts.ContainsKey(ip))
                    LoginAttempts[ip] = (1, DateTime.UtcNow);
                else
                    LoginAttempts[ip] = (LoginAttempts[ip].Count + 1, DateTime.UtcNow);

                return Unauthorized("Invalid credentials");
            }

            var requestedRole = (dto.SelectedRole ?? "support").Trim().ToLowerInvariant();

            // Enforce panel access by permission level
            if (requestedRole == "admin" && (user.Role?.PermissionLevel ?? 0) != 3)
                return Unauthorized("Only administrators can use Admin login.");

            if (requestedRole != "admin" && (user.Role?.PermissionLevel ?? 0) < 2)
                return Unauthorized("Only supporters or administrators can access this panel.");

            // Check if user is deactivated (only when UserProfiles table exists)
            if (IsUserProfilesTableAvailable())
            {
                var profile = _db.UserProfiles.FirstOrDefault(p => p.UserId == user.Id);
                if (profile != null && !profile.IsActive)
                    return Unauthorized("Konto er deaktiveret.");
            }

            // Check RFID for admin-level users
            if (user.Role?.PermissionLevel == 3 && (string.IsNullOrWhiteSpace(dto.RfidChip) || dto.RfidChip != user.RfidChip))
            {
                return Unauthorized("RFID is required for Admin login.");
            }

            // Successful login: clear failed attempts
            if (LoginAttempts.ContainsKey(ip))
                LoginAttempts.Remove(ip);

            // Update LastLoginAt in UserProfile
            UserProfile? userProfile = null;
            if (IsUserProfilesTableAvailable())
            {
                userProfile = _db.UserProfiles.FirstOrDefault(p => p.UserId == user.Id);

                if (userProfile != null && !userProfile.IsActive)
                    return Unauthorized("Konto er deaktiveret.");

                if (userProfile != null)
                {
                    userProfile.LastLoginAt = DateTime.UtcNow;
                    _db.SaveChanges();
                }
            }

            // Create Claims
            var claims = new List<Claim>
            {
                        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                        new Claim(ClaimTypes.Name, user.UserName),
                        new Claim(ClaimTypes.Role, user.Role?.Name ?? "User")
            };

            // Create Token
            var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"]);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(int.Parse(_config["Jwt:ExpireMinutes"])),
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwt = tokenHandler.WriteToken(token);

            // Return result
            return Ok(new
            {
                token = jwt,
                user = new
                {
                    user.Id,
                    user.UserName,
                    user.Email,
                    user.RoleId,
                    user.FirstName,
                    user.LastName,
                    RoleName = user.Role?.Name,
                    userProfile?.SessionTimeoutMinutes,
                    PermissionLevel = user.Role?.PermissionLevel ?? 1
                }
            });
        }
        //-------------------------------------------------- Login for Webform: username OR email + password (NO RFID) --POST /api/auth/loginBruger
        [HttpPost("loginBruger")]
        public IActionResult LoginBruger([FromBody] LoginDto dto)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            // rate limit (same behavior)
            if (LoginAttempts.TryGetValue(ip, out var info))
            {
                if (info.Count >= MAX_ATTEMPTS && DateTime.UtcNow - info.LastAttempt < COOLDOWN)
                    return Unauthorized("3x attempts");
            }

            if (string.IsNullOrWhiteSpace(dto.UserName) || string.IsNullOrWhiteSpace(dto.PassWord))
                return BadRequest("Username/email and password are required.");


            var user = _db.Users
           .Include(u => u.Role)
           .FirstOrDefault(u =>
               (u.UserName == dto.UserName || u.Email == dto.UserName) &&
               u.PassWord == dto.PassWord);

            if (user == null)
            {
                if (!LoginAttempts.ContainsKey(ip))
                    LoginAttempts[ip] = (1, DateTime.UtcNow);
                else
                    LoginAttempts[ip] = (LoginAttempts[ip].Count + 1, DateTime.UtcNow);

                return Unauthorized("Invalid credentials");
            }

            // Check if user is deactivated (only when UserProfiles table exists)
            if (IsUserProfilesTableAvailable())
            {
                var profile = _db.UserProfiles.FirstOrDefault(p => p.UserId == user.Id);
                if (profile != null && !profile.IsActive)
                    return Unauthorized("Din konto er deaktiveret.");
            }



            // IMPORTANT: no RFID check here
            if (LoginAttempts.ContainsKey(ip))
                LoginAttempts.Remove(ip);

            // Update LastLoginAt in UserProfile 
            var userProfile = _db.UserProfiles.FirstOrDefault(p => p.UserId == user.Id);
            if (IsUserProfilesTableAvailable())
            {
                
                if (userProfile != null)
                {
                    userProfile.LastLoginAt = DateTime.UtcNow;
                    _db.SaveChanges();
                }
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Role, user.Role?.Name ?? "User")
                                            };

            var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"]);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(int.Parse(_config["Jwt:ExpireMinutes"])),
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwt = tokenHandler.WriteToken(token);

            return Ok(new
            {
                token = jwt,
                user = new
                {
                    user.Id,
                    user.UserName,
                    user.Email,
                    user.RoleId,
                    user.FirstName,
                    user.LastName,
                    user.Role?.Name,
                    userProfile?.SessionTimeoutMinutes,
                    PermissionLevel = user.Role?.PermissionLevel ?? 1
                }
            });
        }

        //-------------------------------------------------- Login for Mobile app: username OR email + password (NO RFID) --POST /api/auth/login-mobile
        [HttpPost("login-mobile")]
        public IActionResult LoginMobile([FromBody] LoginDto dto)
        {
            dto.RfidChip = null;
            return LoginBruger(dto);
        }

        //-------------------------------------------------- Forgot Password - generate token and send email (email sending not implemented here) POST /api/auth/forgot-password
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var user = _db.Users.FirstOrDefault(u => u.Email == dto.Email);
            if (user == null) return Ok(); // avoid user enumeration

            user.PasswordResetToken = Guid.NewGuid().ToString("N");
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddMinutes(15);

            // OTP (6 digits)
            user.PasswordResetOtp = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
            user.PasswordResetOtpExpiry = DateTime.UtcNow.AddMinutes(10);
            _db.SaveChanges();

            var client = (dto.Client ?? "web").ToLowerInvariant();

            var baseUrl = client switch
            {
                "admin" => _config["AdminWeb:BaseUrl"], // WebAdmin panel Admin and Support
                "user" => _config["UserWeb:BaseUrl"], // WebFormular til almindelige brugere AdminWeb
                _ => _config["Web:BaseUrl"]
            };
            if (string.IsNullOrWhiteSpace(baseUrl))
                baseUrl = _config["Web:BaseUrl"]; // fallback to something valid

            var resetLink = $"{baseUrl?.TrimEnd('/')}/Login/ResetPassword?token={user.PasswordResetToken}";
            //var resetLink = $"{baseUrl}/Login/ResetPassword?token={user.PasswordResetToken}";


            await _email.SendPasswordResetAsync(
                toEmail: user.Email,
                userName: user.UserName,
                otpCode: user.PasswordResetOtp,
                resetLink: resetLink
            );
            return Ok();
        }

        [HttpPost("request-password-change")]
        public async Task<IActionResult> RequestPasswordChangePermission([FromBody] PasswordChangePermissionRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest("Email is required.");

            var requester = string.IsNullOrWhiteSpace(dto.UserName) ? dto.Email : dto.UserName;
            var reason = string.IsNullOrWhiteSpace(dto.Reason) ? "Ingen begrundelse angivet." : dto.Reason.Trim();

            var admins = _db.Users
                .Include(u => u.Role)
                .Where(u => u.Role != null && u.Role.PermissionLevel == 3)
                .ToList();

            if (admins.Count == 0)
                return StatusCode(500, "No administrators found to receive notification.");

            foreach (var admin in admins)
            {
                var notification = new Notification
                {
                    UserId = admin.Id,
                    Type = "PasswordResetRequest",
                    Message = $"Brugeren {requester} ({dto.Email}) har anmodet om nulstilling af adgangskode. Begrundelse: {reason}",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };

                _db.Notifications.Add(notification);
            }

            await _db.SaveChangesAsync();

            // Vi sender stadig en bekræftelse til brugeren
            await _email.SendAsync(
                dto.Email,
                "NexDesk: din anmodning er sendt",
                "<p>Vi har sendt din anmodning om adgangskodeændring til administratorerne.</p><p>Du får besked, når den er behandlet.</p>");

            return Ok();
        }

        //-------------------------------------------------- Reset Password using token POST /api/auth/reset-password - POST /api/auth/reset-password
        [HttpPost("reset-password")]
        public IActionResult ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var now = DateTime.UtcNow;

            var user = _db.Users.FirstOrDefault(u =>
                u.PasswordResetToken == dto.Token &&
                u.PasswordResetTokenExpiry > now &&
                u.PasswordResetOtp == dto.OtpCode &&
                u.PasswordResetOtpExpiry > now);
            if (user == null)
                return Unauthorized("Invalid or expired token");

            user.PassWord = PasswordHelper.Hash(dto.NewPassword);
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiry = null;

            user.PasswordResetOtp = null;
            user.PasswordResetOtpExpiry = null;

            _db.SaveChanges();
            return Ok("Password reset successful");
        }
        private bool IsUserProfilesTableAvailable()
        {
            if (_isUserProfilesTableAvailable.HasValue)
                return _isUserProfilesTableAvailable.Value;

            try
            {
                _ = _db.UserProfiles.AsNoTracking().Select(p => p.Id).FirstOrDefault();
                _isUserProfilesTableAvailable = true;
            }
            catch (SqlException ex) when (ex.Number == 208 && ex.Message.Contains("UserProfiles", StringComparison.OrdinalIgnoreCase))
            {
                _isUserProfilesTableAvailable = false;
            }
            catch (SqliteException ex) when (ex.SqliteErrorCode == 1 && ex.Message.Contains("UserProfiles", StringComparison.OrdinalIgnoreCase))
            {
                _isUserProfilesTableAvailable = false;
            }

            return _isUserProfilesTableAvailable ?? true;
        }

    }
}
