using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexDesk.API.Controllers.Common;
using NexDesk.Domain.Entities.Task;
using NexDesk.Domain.IServices;
using NexDesk.Infrastructure;

namespace NexDesk.API.Controllers.Crud.Tasks
{
    [ApiController]
    [Route("api/tasks")]
    public class TasksController : CrudControllerAPI<TicketTask>
    {
        private readonly IEmailService _emailService;
        private readonly IConfiguration _config;

        public TasksController(NexDeskDbContext db, IEmailService emailService, IConfiguration config) : base(db)
        {
            _emailService = emailService;
            _config = config;
        }

        // ----------------- READ ALL --------------------------- GET api/Tasks
        [HttpGet]
        public override async Task<IActionResult> GetAll()
        {
            var Tasks = await _db.Tasks
                .Include(t => t.Status)
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedUser)
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return Ok(Tasks);
        }

        // ----------------- READ by ID ------------------------- GET api/Tasks/{id}
        [HttpGet("{id:int}")]
        public override async Task<IActionResult> GetById(int id)
        {
            var Tasks = await _db.Tasks
                .Include(t => t.Status)
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedUser)
                .FirstOrDefaultAsync(t => t.Id == id && t.IsActive);

            return Tasks == null ? NotFound() : Ok(Tasks);
        }

        // ----------------- CREATE ----------------------------- POST api/Tasks
        [HttpPost]
        public override async Task<IActionResult> Create([FromBody] TicketTask entity)
        {
            if (entity == null)
                return BadRequest("Task data is required.");

            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;
            entity.IsActive = true;

            _db.Tasks.Add(entity);
            await _db.SaveChangesAsync();

            var createdTask = await _db.Tasks
                .Include(t => t.Status)
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedUser)
                .Include(t => t.Ticket).ThenInclude(tk => tk.TicketPriority)
                .FirstOrDefaultAsync(t => t.Id == entity.Id);

            return CreatedAtAction(nameof(GetById), new { id = entity.Id }, createdTask);
        }
        // ----------------- UPDATE ----------------------------- PUT api/Tasks/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] TicketTask entity, [FromQuery] bool sendEmail = false)
        {
            if (entity == null || id != entity.Id)
                return BadRequest("Invalid task data.");

            var existingTask = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.IsActive);
            if (existingTask == null)
                return NotFound();

            var previousAssignedId = existingTask.AssignedUserId;
            var newAssignedId = entity.AssignedUserId;
            bool assignmentChanged = newAssignedId.HasValue && newAssignedId != previousAssignedId;

            existingTask.TicketId = entity.TicketId;
            existingTask.AssignedUserId = entity.AssignedUserId;
            existingTask.StatusId = entity.StatusId;
            existingTask.Title = entity.Title;
            existingTask.Description = entity.Description;
            existingTask.DueDate = entity.DueDate;
            existingTask.ClosedAt = entity.ClosedAt;
            existingTask.IsActive = entity.IsActive;
            existingTask.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            var updatedTask = await _db.Tasks
                .Include(t => t.Status)
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedUser)
                .Include(t => t.Ticket).ThenInclude(tk => tk.TicketPriority)
                .Include(t => t.Ticket).ThenInclude(tk => tk.AssignedToUser) 
                .FirstOrDefaultAsync(t => t.Id == id);

            if (assignmentChanged && sendEmail && updatedTask?.AssignedUser != null && !string.IsNullOrEmpty(updatedTask.AssignedUser.Email))
            {
                var webBase = _config["AdminWeb:BaseUrl"];
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _emailService.SendTicketAssignedAsync(
                            to: updatedTask.AssignedUser.Email,
                            createdByName: updatedTask.Ticket?.AssignedToUser?.UserName,
                            supporterName: $"{updatedTask.AssignedUser.FirstName} {updatedTask.AssignedUser.LastName}",
                            ticketId: updatedTask.TicketId,
                            ticketTitle: updatedTask.Ticket?.Title ?? $"Ticket #{updatedTask.TicketId}",
                            description: updatedTask.Description ?? "Ingen beskrivelse",
                            priority: updatedTask.Ticket?.TicketPriority?.Name ?? "Ukendt",
                            dueDate: updatedTask.DueDate?.ToString("dd-MM-yyyy") ?? updatedTask.CreatedAt.ToString("dd-MM-yyyy"),
                            ticketUrl: $"{webBase}/Tickets/Detail/{updatedTask.TicketId}",
                            taskTitle: updatedTask.Title
                        );
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[Email] Fejl: {ex.Message}");
                    }
                });
            }

            return Ok(updatedTask);
        }
        // ----------------- DELETE ----------------------------- DELETE api/Tasks/{id}
        [HttpDelete("{id:int}")]
        public override async Task<IActionResult> Delete(int id)
        {
            var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == id);
            if (task == null)
                return NotFound();

            task.IsActive = false;
            task.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return NoContent();
        }


        // ----------------- GET - by - GetByUser ----------------GET api/Tasks/by-user/{id}
        [HttpGet("by-user/{userId:int}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            var Tasks = await _db.Tasks
                .Include(t => t.Status)
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedUser)
                .Where(t => t.AssignedUserId == userId && t.IsActive)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return Ok(Tasks);
        }

    }
}