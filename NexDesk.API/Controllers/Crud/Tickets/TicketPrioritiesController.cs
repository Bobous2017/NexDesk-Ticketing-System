using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexDesk.Infrastructure;

namespace NexDesk.API.Controllers.Crud.Tickets
{
    [ApiController]
    [Route("api/ticketpriorities")]
    public class TicketPrioritiesController : ControllerBase
    {
        private readonly NexDeskDbContext _db;

        public TicketPrioritiesController(NexDeskDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _db.TicketPriorities
                .OrderBy(x => x.Name == "Low" ? 1 :
                              x.Name == "Medium" ? 2 :
                              x.Name == "High" ? 3 :
                              x.Name == "Critical" ? 4 : 99)
                .ThenBy(x => x.Name)
                .ToListAsync();

            return Ok(items);
        }
    }

}
