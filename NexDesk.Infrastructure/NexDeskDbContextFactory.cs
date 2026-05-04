using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace NexDesk.Infrastructure
{
    public class NexDeskDbContextFactory : IDesignTimeDbContextFactory<NexDeskDbContext>
    {
        public NexDeskDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<NexDeskDbContext>();

            // This is  for  publishing the application to Azure, as Docker or Azure needs a connection string at design time to run migrations.
            optionsBuilder.UseSqlServer(
                "Server=localhost,1433;Database=NexDeskDB;User Id=sa;Password=NexDesk2025!;TrustServerCertificate=True;"
            );

            return new NexDeskDbContext(optionsBuilder.Options);
        }
    }
}