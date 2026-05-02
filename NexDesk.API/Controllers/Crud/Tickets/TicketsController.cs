using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexDesk.API.Controllers.Common;
using NexDesk.Domain.Dtos.TicketsDto;
using NexDesk.Domain.Entities;
using NexDesk.Domain.IServices;
using NexDesk.Infrastructure;

namespace NexDesk.API.Controllers.Crud.Tickets
{
    [ApiController]
    [Route("api/tickets")]
    public class TicketsController : CrudControllerAPI<Ticket>
    {
        private readonly IEmailService _emailService;
        private readonly IConfiguration _config;
        private readonly INotificationService _notification;

        public TicketsController(NexDeskDbContext db, IEmailService emailService, IConfiguration config, INotificationService notification) : base(db)
        {
            _emailService = emailService; // Inject the email service
            _config = config; // Inject configuration for email settings if needed because 
            _notification = notification;
        }

        // ----------------- READ ALL --------------------------- GET api/tickets
        [HttpGet]
        public override async Task<IActionResult> GetAll()
        {
            var tickets = await _db.TicketTask
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedToUser)
                .Include(t => t.TicketCategory)
                .Include(t => t.TicketPriority)
                .Include(t => t.Status)
                .Include(t => t.TicketDepartment)
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return Ok(tickets);
        }

        // ----------------- READ by ID ------------------------- GET api/tickets/{id}
        [HttpGet("{id:int}")]
        public override async Task<IActionResult> GetById(int id)
        {
            var ticket = await _db.TicketTask
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedToUser)
                .Include(t => t.TicketCategory)
                .Include(t => t.TicketPriority)
                .Include(t => t.Status)
                .Include(t => t.TicketDepartment)
                .FirstOrDefaultAsync(t => t.Id == id && t.IsActive);

            return ticket == null ? NotFound() : Ok(ticket);
        }

        // ----------------- CREATE ----------------------------- POST api/tickets
        [HttpPost]
        public override async Task<IActionResult> Create([FromBody] Ticket entity)
        {
            if (entity == null)
                return BadRequest("Ticket data is required.");

            if (!await _db.Users.AnyAsync(u => u.Id == entity.CreatedByUserId))
                return BadRequest("Invalid CreatedByUserId.");

            if (entity.AssignedToUserId.HasValue && !await _db.Users.AnyAsync(u => u.Id == entity.AssignedToUserId.Value))
                return BadRequest("Invalid AssignedToUserId.");

            if (!await _db.TicketCategories.AnyAsync(c => c.Id == entity.TicketCategoryId))
                return BadRequest("Invalid TicketCategoryId.");

            if (!await _db.TicketPriorities.AnyAsync(p => p.Id == entity.TicketPriorityId))
                return BadRequest("Invalid TicketPriorityId.");

            if (!await _db.Statuses.AnyAsync(s => s.Id == entity.StatusId))
                return BadRequest("Invalid StatusId.");

            if (!await _db.TicketDepartments.AnyAsync(d => d.Id == entity.TicketDepartmentId))
                return BadRequest("Invalid TicketDepartmentId.");

            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;
            entity.IsActive = true;

            _db.TicketTask.Add(entity);
            await _db.SaveChangesAsync();

            await _notification.NotifyTicketCreatedAsync(entity.CreatedByUserId, entity.Id, entity.Title);

            if (entity.AssignedToUserId.HasValue)
                await _notification.NotifyTicketAssignedAsync(entity.AssignedToUserId.Value, entity.Id, entity.Title);

            var createdTicket = await _db.TicketTask
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedToUser)
                .Include(t => t.TicketCategory)
                .Include(t => t.TicketPriority)
                .Include(t => t.Status)
                .Include(t => t.TicketDepartment)
                .FirstOrDefaultAsync(t => t.Id == entity.Id);

            return CreatedAtAction(nameof(GetById), new { id = entity.Id }, createdTicket);
        }


        // ----------------- UPDATE ----------------------------- PUT api/tickets/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Ticket entity, [FromQuery] bool sendEmail = false)
        {
            if (entity == null || id != entity.Id)
                return BadRequest("Invalid ticket data.");

            var existingTicket = await _db.TicketTask.FirstOrDefaultAsync(t => t.Id == id);
            if (existingTicket == null)
                return NotFound();

            var previousAssignedId = existingTicket.AssignedToUserId;
            var newAssignedId = entity.AssignedToUserId;
            bool assignmentChanged = newAssignedId.HasValue && newAssignedId != previousAssignedId;

            existingTicket.CreatedByUserId = entity.CreatedByUserId;
            existingTicket.AssignedToUserId = entity.AssignedToUserId;
            existingTicket.TicketCategoryId = entity.TicketCategoryId;
            existingTicket.TicketPriorityId = entity.TicketPriorityId;
            existingTicket.StatusId = entity.StatusId;
            existingTicket.TicketDepartmentId = entity.TicketDepartmentId;
            existingTicket.Title = entity.Title;
            existingTicket.Description = entity.Description;
            existingTicket.DueDate = entity.DueDate;
            existingTicket.ClosedAt = entity.ClosedAt;
            existingTicket.IsActive = entity.IsActive;
            existingTicket.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();


                                  
            var updatedTicket = await _db.TicketTask
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedToUser)
                .Include(t => t.TicketCategory)
                .Include(t => t.TicketPriority)
                .Include(t => t.Status)
                .Include(t => t.TicketDepartment)
                .FirstOrDefaultAsync(t => t.Id == id);

            // *------------------- Notify the creator and assigned user about the update ----------------------- 
            if (updatedTicket?.AssignedToUserId.HasValue == true)
                await _notification.NotifyTicketUpdatedAsync(updatedTicket.AssignedToUserId.Value, updatedTicket.Id, updatedTicket.Title);

            if (updatedTicket?.ClosedAt != null && updatedTicket?.AssignedToUserId.HasValue == true)
                await _notification.NotifyTicketClosedAsync(updatedTicket.AssignedToUserId.Value, updatedTicket.Id, updatedTicket.Title);

            if (assignmentChanged && sendEmail && updatedTicket?.AssignedToUser != null && !string.IsNullOrEmpty(updatedTicket.AssignedToUser.Email))
            {
                var supporter = updatedTicket.AssignedToUser;
                var priority = updatedTicket.TicketPriority?.Name ?? "Ukendt";
                var dueDate = updatedTicket.DueDate?.ToString("dd-MM-yyyy");
                var webBase = _config["AdminWeb:BaseUrl"];
                var ticketUrl = $"{webBase}/Tickets/Detail/{id}";

                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _emailService.SendTicketAssignedAsync(
                            to: supporter.Email,
                            supporterName: $"{supporter.FirstName} {supporter.LastName}",
                            ticketId: id,
                            ticketTitle: updatedTicket.Title ?? "Ingen titel",
                            description: updatedTicket.Description ?? "Ingen beskrivelse",
                            priority: priority,
                            dueDate: dueDate,
                            ticketUrl: ticketUrl,
                            createdByName: $"{updatedTicket.CreatedByUser?.FirstName} {updatedTicket.CreatedByUser?.LastName}".Trim()
                        // taskTitle not passed = ticket email
                        );
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[Email] Fejl ved afsendelse: {ex.Message}");
                    }
                });
            }

            return Ok(updatedTicket);
        }


        // ----------------- DELETE ----------------------------- DELETE api/tickets/{id}
        [HttpDelete("{id:int}")]
        public override async Task<IActionResult> Delete(int id)
        {
            var ticket = await _db.TicketTask.FirstOrDefaultAsync(t => t.Id == id);
            if (ticket == null)
                return NotFound();

            ticket.IsActive = false;
            ticket.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return NoContent();
        }


        // ----------------- GET - by - GetByUser ----------------GET api/tickets/by-user/{id}
        [HttpGet("by-user/{userId:int}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            var tickets = await _db.TicketTask
                .Include(t => t.TicketCategory)
                .Include(t => t.TicketPriority)
                .Include(t => t.Status)
                .Include(t => t.TicketDepartment)
                .Include(t => t.Reports)
                .Where(t => t.CreatedByUserId == userId && t.IsActive)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var ticketDtos = tickets.Select(t => new TicketDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                CreatedAt = t.CreatedAt,
                ClosedAt = t.ClosedAt,
                ResolutionText = t.Reports.OrderByDescending(r => r.CreatedAt).FirstOrDefault()?.ResolutionText ?? "",
                TicketCategory = t.TicketCategory != null ? new LookupDto { Id = t.TicketCategory.Id, Name = t.TicketCategory.Name } : null,
                TicketPriority = t.TicketPriority != null ? new LookupDto { Id = t.TicketPriority.Id, Name = t.TicketPriority.Name } : null,
                Status = t.Status != null ? new LookupDto { Id = t.Status.Id, Name = t.Status.Name } : null,
                TicketDepartment = t.TicketDepartment != null ? new LookupDto { Id = t.TicketDepartment.Id, Name = t.TicketDepartment.Name } : null
            }).ToList();

            return Ok(ticketDtos);
        }

    }
}









