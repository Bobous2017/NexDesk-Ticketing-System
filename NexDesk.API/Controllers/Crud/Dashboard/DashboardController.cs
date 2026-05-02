using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexDesk.API.Controllers.Common;
using NexDesk.Domain.Dtos.DashboardDto;
using NexDesk.Domain.Entities;
using NexDesk.Infrastructure;

namespace NexDesk.API.Controllers.Crud.Dashboard
{
    [ApiController]
    [Route("api/dashboard")]
    public class DashboardController : ControllerBase
    {
        private readonly NexDeskDbContext _db;

        public DashboardController(NexDeskDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            var tickets = await _db.TicketTask
                .Include(t => t.AssignedToUser)
                .Include(t => t.TicketCategory)
                .Include(t => t.TicketPriority)
                .Include(t => t.Status)
                .Include(t => t.TicketDepartment)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var openCount = tickets.Count(t =>
                t.Status != null &&
                t.Status.Name == "Open");

            var inProgressCount = tickets.Count(t =>
                t.Status != null &&
                (t.Status.Name == "Waiting for Support" || t.Status.Name == "In Progress"));

            var resolvedCount = tickets.Count(t =>
                t.Status != null &&
                (t.Status.Name == "Resolved" || t.Status.Name == "Closed"));

            var activeAssignees = tickets
                .Where(t =>
                    t.AssignedToUserId.HasValue &&
                    t.Status != null &&
                    (t.Status.Name == "Waiting for Support" || t.Status.Name == "In Progress"))
                .Select(t => t.AssignedToUserId!.Value)
                .Distinct()
                .Count();

            var unassignedTickets = tickets.Count(t => !t.AssignedToUserId.HasValue);

            var overdueTickets = tickets.Count(t =>
                t.DueDate.HasValue &&
                t.DueDate.Value < DateTime.UtcNow &&
                t.Status != null &&
                t.Status.Name != "Resolved" &&
                t.Status.Name != "Closed");

            var dto = new DashboardDto
            {
                OpenTickets = openCount,
                InProgressTickets = inProgressCount,
                ResolvedTickets = resolvedCount,
                TotalTickets = tickets.Count,
                ActiveAssignees = activeAssignees,
                UnassignedTickets = unassignedTickets,
                OverdueTickets = overdueTickets,
                RecentTickets = tickets
                    .Take(5)
                    .Select(t => new DashboardTicketItemDto
                    {
                        Id = t.Id,
                        Title = t.Title,
                        CategoryName = t.TicketCategory != null ? t.TicketCategory.Name : "-",
                        DepartmentName = t.TicketDepartment != null ? t.TicketDepartment.Name : "-",
                        PriorityName = t.TicketPriority != null ? t.TicketPriority.Name : "-",
                        StatusName = t.Status != null ? t.Status.Name : "-",
                        AssignedToName = t.AssignedToUser != null
                            ? ((t.AssignedToUser.FirstName ?? "") + " " + (t.AssignedToUser.LastName ?? "")).Trim()
                            : "Unassigned",
                        CreatedAt = t.CreatedAt
                    })
                    .ToList()
            };

            return Ok(dto);
        }
    }
}