using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexDesk.Infrastructure;

namespace NexDesk.API.Controllers.Common
{
    [ApiController]
    [Route("api/[controller]")] //http://ipAddress:port/api/[controller name]
    public class CrudControllerAPI<TEntity> : ControllerBase where TEntity : class
    {
        protected readonly NexDeskDbContext _db; //--- Protected to allow access in derived classes
        private readonly DbSet<TEntity> _set; //------ DbSet for the entity type

        // ----------------- Constructor --------------
        public CrudControllerAPI(NexDeskDbContext db)
        {
            _db = db; // Initialize the DbContext
            _set = _db.Set<TEntity>(); // Initialize the DbSet for the entity type
        }

        // ----------------- READ All ----------------
        [HttpGet]
        public virtual async Task<IActionResult> GetAll() => Ok(await _set.ToListAsync());

        // ----------------- READ by ID --------------
        [HttpGet("{id}")]
        public virtual async Task<IActionResult> GetById(int id)
        {
            var entity = await _set.FindAsync(id);
            return entity == null ? NotFound() : Ok(entity);
        }

        // ----------------- CREATE ------------------
        [HttpPost]
        public virtual async Task<IActionResult> Create([FromBody] TEntity entity)
        {
            _set.Add(entity);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = GetEntityId(entity) }, entity);
        }

        // ----------------- UPDATE -------------------
        [HttpPut("{id}")]
        public virtual async Task<IActionResult> Update(int id, [FromBody] TEntity entity)
        {
            _db.Entry(entity).State = EntityState.Modified;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // ----------------- DELETE -------------------
        [HttpDelete("{id}")]
        public virtual async Task<IActionResult> Delete(int id)
        {
            var entity = await _set.FindAsync(id);
            if (entity == null) return NotFound();

            _set.Remove(entity);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // Helper method to get the entity's Id value
        // Override  if some entities use a different Id property
        protected virtual int GetEntityId(TEntity entity)
        {
            var property = typeof(TEntity).GetProperty("Id");
            return property != null ? (int)property.GetValue(entity)! : 0;
        }
    }
}
