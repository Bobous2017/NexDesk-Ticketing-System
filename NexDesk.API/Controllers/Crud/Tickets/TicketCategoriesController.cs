using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexDesk.API.Controllers.Common;
using NexDesk.Domain.Entities;
using NexDesk.Infrastructure;

namespace NexDesk.API.Controllers.Crud.Tickets
{
    [ApiController]
    [Route("api/ticketcategories")]
    public class TicketCategoriesController : CrudControllerAPI<TicketCategory>
    {
        public TicketCategoriesController(NexDeskDbContext db) : base(db) { }
        // Base CRUD handles everything
    }

}
