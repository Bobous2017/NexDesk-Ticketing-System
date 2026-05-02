using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexDesk.API.Controllers.Common;
using NexDesk.Domain.AuthHelper;
using NexDesk.Domain.Dtos.UserHandlingDto;
using NexDesk.Domain.Entities;
using NexDesk.Infrastructure;
using static System.Net.Mime.MediaTypeNames;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace NexDesk.API.Controllers.Crud
{
    [ApiController]
    [Route("api/users")]
    public class UsersController : CrudControllerAPI<User>
    {
        public UsersController(NexDeskDbContext db) : base(db) { }

        // GET api/users — override to include Role
        [HttpGet]
        public override async Task<IActionResult> GetAll()
        {
            var users = await _db.Users
                .Include(u => u.Role)
                .OrderBy(u => u.FirstName)
                .ToListAsync();
            return Ok(users);
        }

        // GET api/users/5
        [HttpGet("{id:int}")]
        public override async Task<IActionResult> GetById(int id)
        {
            var user = await _db.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return NotFound();

            // Create an anonymous object with RoleName added
            var result = new
            {
                user.Id,
                user.RoleId,
                RoleName = user.Role?.Name,
                user.FirstName,
                user.LastName,
                user.UserName,
                user.PassWord,
                user.Email,
                user.Phone,
                user.RfidChip,
                user.PasswordResetTokenExpiry,
                user.PasswordResetToken,
                user.PasswordResetOtp,
                user.PasswordResetOtpExpiry,
                user.SessionTimeoutMinutes,
                Role = user.Role
            };

            return Ok(result);
        }

        // POST api/users
        [HttpPost]
        public override async Task<IActionResult> Create([FromBody] User entity)
        {
            if (string.IsNullOrWhiteSpace(entity.UserName))
                return BadRequest("Username is required.");
            if (string.IsNullOrWhiteSpace(entity.Email))
                return BadRequest("Email is required.");

            // Hash password before saving
            if (!string.IsNullOrWhiteSpace(entity.PassWord))
                entity.PassWord = PasswordHelper.Hash(entity.PassWord);

            _db.Users.Add(entity);
            await _db.SaveChangesAsync();

            // AFTER saving, fetch the user WITH their profile (trigger just created it)
            var userWithProfile = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == entity.Id);

            var profile = await _db.UserProfiles
                .FirstOrDefaultAsync(p => p.UserId == entity.Id);

            return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new { user = userWithProfile, profile });


        }

        // PUT api/users/5
        [HttpPut("{id:int}")]
        public override async Task<IActionResult> Update(int id, [FromBody] User entity)
        {
            if (id != entity.Id) return BadRequest();
            var existing = await _db.Users.FindAsync(id);
            if (existing == null) return NotFound();

            existing.FirstName = entity.FirstName;
            existing.LastName = entity.LastName;
            existing.UserName = entity.UserName;
            existing.Email = entity.Email;
            existing.Phone = entity.Phone;
            existing.RoleId = entity.RoleId;
            existing.RfidChip = entity.RfidChip;

            // Only update password if a new one is provided
            if (!string.IsNullOrWhiteSpace(entity.PassWord))
                existing.PassWord = PasswordHelper.Hash(entity.PassWord);

            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpPatch("{id:int}/session")]
        public async Task<IActionResult> UpdateSession(int id, [FromBody] UserSessionDto dto)
        {
            var profile = await _db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == id);
            if (profile == null) return NotFound();

            profile.SessionTimeoutMinutes = dto.SessionTimeoutMinutes;
            await _db.SaveChangesAsync();

            return Ok();
        }

        // DELETE api/users/5
        //
        [HttpDelete("{id}")]
        public override async Task<IActionResult> Delete(int id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();

            var profile = await _db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == id);
            if (profile != null) _db.UserProfiles.Remove(profile);

            var notifications = _db.Notifications.Where(n => n.UserId == id);
            _db.Notifications.RemoveRange(notifications);

            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
            return NoContent();
        }
        [HttpPatch("{id:int}/clear-tokens")]
        public async Task<IActionResult> ClearTokens(int id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiry = null;
            user.PasswordResetOtp = null;
            user.PasswordResetOtpExpiry = null;
            await _db.SaveChangesAsync();
            return Ok();
        }

    }
}