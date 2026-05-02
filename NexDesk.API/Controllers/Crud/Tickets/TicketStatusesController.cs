using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexDesk.Infrastructure;

namespace NexDesk.API.Controllers.Crud.Tickets
{
    [ApiController]
    [Route("api/ticketstatuses")]
    public class TicketStatusesController : ControllerBase
    {
        private readonly NexDeskDbContext _db;

        public TicketStatusesController(NexDeskDbContext db)
        {
            _db = db;
        }
        // Tallene er sorteringsnøgler — ikke database-ID'er. Vi bruger dem fordi en ticket følger et naturligt workflow fra Open til Closed,
        // og vi vil sikre at statuserne altid vises i den rigtige rækkefølge uanset hvad de hedder i databasen. Tallet 99 er en fallback
        // så eventuelle nye statuser automatisk placeres sidst
        [HttpGet] // Tallene er en manuel sorteringsrækkefølg. de fortæller databasen i hvilken logisk rækkefølge statuserne skal vises.
        public async Task<IActionResult> GetAll()
        {
            var items = await _db.Statuses
                .OrderBy(x => x.Name == "Open" ? 1 :               // Første status — ny ticket
                              x.Name == "In Progress" ? 2 :         // Under behandling
                              x.Name == "Waiting for Support" ? 3 : // Afventer svar
                              x.Name == "Resolved" ? 4 :             // Løst
                              x.Name == "Closed" ? 5 : 99)          // Endeligt lukket  og Ukendte statuser kommer sidst
                .ThenBy(x => x.Name)
                .ToListAsync();

            return Ok(items);
        }

    }
}
