using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexDesk.API.Controllers.Common;
using NexDesk.Domain.Entities;
using NexDesk.Infrastructure;

namespace NexDesk.API.Controllers.Crud
{
    [ApiController]
    [Route("api/roles")]
    public class RolesController : CrudControllerAPI<Role>
    {
        public RolesController(NexDeskDbContext db) : base(db) { }
        // Base CRUD handles everything — no overrides needed
        // GetAll, GetById, Create, Update, Delete all work from CrudControllerAPI

        // Since Role only has Id and Name, the base CRUD is enough without any overrides
    }
}
