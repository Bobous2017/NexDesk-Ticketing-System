using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using NexDesk.API.Controllers.Common;
using NexDesk.Domain.Dtos.UserHandlingDto;
using NexDesk.Domain.Entities;
using NexDesk.Infrastructure;

namespace NexDesk.API.Controllers.Crud
{
    [ApiController]
    [Route("api/userprofiles")]
    public class UserProfilesController : CrudControllerAPI<UserProfile>
    {
        public UserProfilesController(NexDeskDbContext db) : base(db) { }

        // GET api/userprofiles — override to include User
        [HttpGet]
        public override async Task<IActionResult> GetAll()
        {
            var profiles = await _db.UserProfiles
                .Include(x => x.User)
                .ToListAsync();
            return Ok(profiles);
        }

        // GET api/userprofiles/5
        [HttpGet("{id:int}")]
        public override async Task<IActionResult> GetById(int id)
        {
            var profile = await _db.UserProfiles
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.Id == id);
            return profile == null ? NotFound() : Ok(profile);
        }

        // GET api/userprofiles/byuser/5
        [HttpGet("byuser/{userId:int}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            var profile = await _db.UserProfiles
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.UserId == userId);
            return profile == null ? NotFound() : Ok(profile);
        }

        // POST api/userprofiles
        [HttpPost]
        public override async Task<IActionResult> Create([FromBody] UserProfile entity)
        {
            _db.UserProfiles.Add(entity);
            await _db.SaveChangesAsync();
            return Ok(entity);
        }

        // PUT api/userprofiles/5
        [HttpPut("{id:int}")]
        public override async Task<IActionResult> Update(int id, [FromBody] UserProfile entity)
        {
            if (id != entity.Id) return BadRequest();
            var existing = await _db.UserProfiles.FindAsync(id);
            if (existing == null) return NotFound();
            existing.IsActive = entity.IsActive;
            existing.LastLoginAt = entity.LastLoginAt;
            existing.ProfilePicture = entity.ProfilePicture;
            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        // PATCH api/userprofiles/byuser/5/toggle-active
        [HttpPatch("byuser/{userId:int}/toggle-active")]
        public async Task<IActionResult> ToggleActive(int userId)
        {
            var profile = await _db.UserProfiles
                .FirstOrDefaultAsync(x => x.UserId == userId);
            if (profile == null) return NotFound();
            profile.IsActive = !profile.IsActive;
            await _db.SaveChangesAsync();
            return Ok(profile);
        }

        // PATCH api/userprofiles/byuser/5/update-login
        [HttpPatch("byuser/{userId:int}/update-login")]
        public async Task<IActionResult> UpdateLogin(int userId)
        {
            var profile = await _db.UserProfiles
                .FirstOrDefaultAsync(x => x.UserId == userId);
            if (profile == null) return NotFound();
            profile.LastLoginAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(profile);
        }


        // PATCH api/userprofiles/byuser/5/update-picture
        [HttpPatch("byuser/{userId:int}/update-picture")]
        public async Task<IActionResult> UpdatePicture(int userId, [FromBody] UpdatePictureDto dto)
        {
            var profile = await _db.UserProfiles.FirstOrDefaultAsync(x => x.UserId == userId);
            if (profile == null)
            {
                // Auto-create if not exists
                //profile = new UserProfile { UserId = userId, IsActive = true };
                profile = new UserProfile { UserId = userId, IsActive = true };
                _db.UserProfiles.Add(profile);
            }
            profile.ProfilePicture = dto.ProfilePicture;
            await _db.SaveChangesAsync();
            return Ok(profile);
        }

        // PATCH api/userprofiles/byuser/5/delete-picture
        [HttpPatch("byuser/{userId:int}/delete-picture")]
        public async Task<IActionResult> DeletePicture(int userId)
        {
            var profile = await _db.UserProfiles.FirstOrDefaultAsync(x => x.UserId == userId);
            if (profile == null) return NotFound();
            profile.ProfilePicture = null;
            await _db.SaveChangesAsync();
            return Ok(profile);
        }
    }
}
