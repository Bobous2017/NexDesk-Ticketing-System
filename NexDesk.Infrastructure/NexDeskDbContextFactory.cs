using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Infrastructure
{
    public class NexDeskDbContextFactory : IDesignTimeDbContextFactory<NexDeskDbContext>
    {
        public NexDeskDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<NexDeskDbContext>();

            // Use your actual connection string here
            optionsBuilder.UseSqlite("Data Source=nexdesk.db"); // Example using SQLite, replace with your database provider and connection string for NexDesk

            return new NexDeskDbContext(optionsBuilder.Options);
        }
    }
}
