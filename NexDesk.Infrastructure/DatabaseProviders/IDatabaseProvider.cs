using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Infrastructure.DatabaseProviders
{
    public interface IDatabaseProvider
    {
        void Configure(DbContextOptionsBuilder options);
    }
}
