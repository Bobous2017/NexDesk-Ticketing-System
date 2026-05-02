using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Infrastructure.DatabaseProviders
{
    public class SqliteProvider : IDatabaseProvider
    {
        private readonly string _connectionString;

        public SqliteProvider(string connectionString)
        {
            _connectionString = connectionString;
        }

        public void Configure(DbContextOptionsBuilder options)
        {
            options.UseSqlite(_connectionString);
        }
    }
}
