using NexDesk.Domain.Entities;

namespace NexDesk.Infrastructure
{
    public static class SeedData
    {
        public static void Seed(NexDeskDbContext db)
        {
            if (db.Users.Any()) return;

            // Step 1 - Insert Roles
            db.Roles.AddRange(
                 new Role { Name = "Admin", PermissionLevel = 3 },
                 new Role { Name = "Support", PermissionLevel = 2 },
                 new Role { Name = "User", PermissionLevel = 1 }
             );
            db.SaveChanges();

            // Step 2 - Read real IDs back from DB
            var adminId = db.Roles.First(r => r.Name == "Admin").Id;
            var supportId = db.Roles.First(r => r.Name == "Support").Id;
            var userId = db.Roles.First(r => r.Name == "User").Id;

            // Step 3 - Insert Users using real IDs
            db.Users.AddRange(
                new User { RoleId = adminId, FirstName = "Olsen", LastName = "Admin", UserName = "Bob2021", PassWord = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a816f2ab448a918", Email = "bobousenselemani2021@gmail.com", Phone = "1478521", RfidChip = "77731" },
                new User { RoleId = supportId, FirstName = "Bob", LastName = "Borrower", UserName = "bobby2", PassWord = "c4246e2a0959ca352e7e9d22670a6f959662c78c66d0313f0da36e0144121e0e", Email = "bobx0266@example.com", Phone = "987654321", RfidChip = "11173H" },
                new User { RoleId = adminId, FirstName = "Seb", LastName = "SebSeb", UserName = "seb", PassWord = "c4246e2a0959ca352e7e9d22670a6f959662c78c66d0313f0da36e0144121e0e", Email = "sebseb@example.com", Phone = "9632587414", RfidChip = "C3DFF73F" },
                new User { RoleId = userId, FirstName = "boby", LastName = "boby2", UserName = "bobby", PassWord = "d204a8e49b4888899ec8a3acdf6c0389215ef18eed1628717f0e5b5c12afb428", Email = "bobousenselemani2017@gmail.com", Phone = "987654321", RfidChip = "00733" },
                new User { RoleId = adminId, FirstName = "Emile", LastName = "Emile1", UserName = "Emile", PassWord = "56851cd276752741f83ce4741541bd12c78562d0ad74e00626ac4f238f8ba51b", Email = "emile@gmail.com", Phone = "147852", RfidChip = "12345" },
                new User { RoleId = supportId, FirstName = "Mads", LastName = "Madss", UserName = "Mads3", PassWord = "f2cbc59bad242d3ec36e839ff8cba8a91a6f5e47c50a20c6547fbbcd71ed24", Email = "mads@gmail.com", Phone = "369852147", RfidChip = "888F733" },
                new User { RoleId = adminId, FirstName = "Bobo", LastName = "Limpoge", UserName = "bobo", PassWord = "d204a8e49b4888899ec8a3acdf6c0389215ef18eed1628717f0e5b5c12afb428", Email = "bobx0265@example.com", Phone = "9876543214", RfidChip = "12345" }
            );
            db.SaveChanges();
        }
    }
}