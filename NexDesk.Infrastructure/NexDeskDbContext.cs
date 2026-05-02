using Microsoft.EntityFrameworkCore;
using NexDesk.Domain.Entities;
using NexDesk.Domain.Entities.Task;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Infrastructure
{
    public class NexDeskDbContext : DbContext
    {
        // Constructor der initialiserer DbContext med de indstillinger (f.eks. SQL Server-forbindelse), der er defineret i Program.cs.
        public NexDeskDbContext(DbContextOptions<NexDeskDbContext> options) : base(options) { }
        public DbSet<Role> Roles => Set<Role>(); // Repræsentationen af 'Roles'-tabellen i databasen. Set<Role>() sikrer, at den aldrig er null. 
        public DbSet<User> Users => Set<User>(); // Repræsentationen af 'Users'-tabellen i databasen. Bruges til at forespørge og gemme brugere.
        public DbSet<Ticket> TicketTask => Set<Ticket>();
        public DbSet<TicketCategory> TicketCategories => Set<TicketCategory>();
        public DbSet<TicketDepartment> TicketDepartments => Set<TicketDepartment>();
        public DbSet<TicketPriority> TicketPriorities => Set<TicketPriority>();
        public DbSet<Status> Statuses => Set<Status>();
        public DbSet<TicketTask> Tasks => Set<TicketTask>();

        public DbSet<Notification> Notifications => Set<Notification>(); // Repræsentationen af 'Notifications'-tabellen i databasen. Bruges til at forespørge og gemme notifikationer.
        public DbSet<Comment> Comments => Set<Comment>();
        public DbSet<HistoryEntry> HistoryEntries => Set<HistoryEntry>();
        public DbSet<Report> Reports => Set<Report>();

        public DbSet<UserProfile> UserProfiles => Set<UserProfile>();

        public DbSet<ReportEmailLog> ReportEmailLogs => Set<ReportEmailLog>();

        public DbSet<Attachment> Attachments => Set<Attachment>(); // Repræsentationen af 'Attachments'-tabellen i databasen. 

        //**************** Her defineres databasens struktur og relationer (Fluent API), som overskriver standard-reglerne. ******************
        protected override void OnModelCreating(ModelBuilder b)
        {
          

            //-------------------------------- Role entitet konfiguration ------------------------------ 1
            b.Entity<Role>().HasKey(x => x.Id); // Sætter 'Id' som den primære nøgle (Primary Key) for tabellen.
            b.Entity<Role>().HasIndex(x => x.Name).IsUnique(); // Opretter et unikt indeks på 'Name', så to roller ikke kan have samme navn (f.eks. "Admin").
            b.Entity<Role>().Property(x => x.PermissionLevel).HasColumnName("Permission_Level");

            //-------------------------------- User entitet konfiguration ------------------------------ 2
            b.Entity<User>().HasKey(x => x.Id); // Sætter 'Id' som den primære nøgle for User-tabellen.
            b.Entity<User>().HasIndex(x => x.Email).IsUnique(); // Sikrer at to brugere ikke kan registrere sig med den samme e-mailadresse.

            // Definerer relationen: En bruger har ét Role, og et Role kan være knyttet til mange brugere.
            b.Entity<User>().HasOne(x => x.Role).WithMany().HasForeignKey(x => x.RoleId);// HasForeignKey er 'RoleId' i User-tabellen er forbindelsen (Foreign Key).
            b.Entity<User>().Ignore(x => x.SessionTimeoutMinutes);
            b.Entity<User>().ToTable(tb => tb.HasTrigger("trg_UserProfile_AutoCreate"));
           



            //------------------------------- UserProfil ------------------------------------------
            b.Entity<UserProfile>().ToTable("UserProfiles");
            b.Entity<UserProfile>().HasKey(x => x.Id);
            b.Entity<UserProfile>().Property(x => x.Id).HasColumnName("Id");
            b.Entity<UserProfile>().Property(x => x.UserId).HasColumnName("User_Id");
            b.Entity<UserProfile>().Property(x => x.IsActive).HasColumnName("Is_Active").IsRequired();
            b.Entity<UserProfile>().Property(x => x.LastLoginAt).HasColumnName("Last_Login_At");
            b.Entity<UserProfile>().Property(x => x.ProfilePicture).HasColumnName("Profile_Picture").HasMaxLength(500);
            b.Entity<UserProfile>().Property(x => x.SessionTimeoutMinutes).HasColumnName("Session_Timeout_Minutes");
            b.Entity<UserProfile>().HasIndex(x => x.UserId).IsUnique();
            b.Entity<UserProfile>()
                .HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);


            //--------------------------------- Ticket entitet konfiguration ---------------------------- 3

            // TicketCategories
            b.Entity<TicketCategory>().ToTable("Ticket_Categories");
            b.Entity<TicketCategory>().HasKey(x => x.Id);
            b.Entity<TicketCategory>().Property(x => x.Id).HasColumnName("Id");
            b.Entity<TicketCategory>().Property(x => x.Name).HasColumnName("Name").HasMaxLength(50).IsRequired();
            b.Entity<TicketCategory>().HasIndex(x => x.Name).IsUnique();

            // TicketDepartments
            b.Entity<TicketDepartment>().ToTable("Ticket_Departments");
            b.Entity<TicketDepartment>().HasKey(x => x.Id);
            b.Entity<TicketDepartment>().Property(x => x.Id).HasColumnName("Id");
            b.Entity<TicketDepartment>().Property(x => x.Name).HasColumnName("Name").HasMaxLength(50).IsRequired();
            b.Entity<TicketDepartment>().HasIndex(x => x.Name).IsUnique();

            // TicketPriorities
            b.Entity<TicketPriority>().ToTable("Ticket_Priorities");
            b.Entity<TicketPriority>().HasKey(x => x.Id);
            b.Entity<TicketPriority>().Property(x => x.Id).HasColumnName("Id");
            b.Entity<TicketPriority>().Property(x => x.Name).HasColumnName("Name").HasMaxLength(50).IsRequired();
            b.Entity<TicketPriority>().HasIndex(x => x.Name).IsUnique();

            // Statuses
            b.Entity<Status>().ToTable("Statuses");
            b.Entity<Status>().HasKey(x => x.Id);
            b.Entity<Status>().Property(x => x.Id).HasColumnName("Id");
            b.Entity<Status>().Property(x => x.Name).HasColumnName("Name").HasMaxLength(50).IsRequired();
            b.Entity<Status>().HasIndex(x => x.Name).IsUnique();

            // Tickets
            b.Entity<Ticket>().ToTable("Tickets");
            b.Entity<Ticket>().HasKey(x => x.Id);

            b.Entity<Ticket>().Property(x => x.Id).HasColumnName("Id");
            b.Entity<Ticket>().Property(x => x.CreatedByUserId).HasColumnName("Created_By_User_Id");
            b.Entity<Ticket>().Property(x => x.AssignedToUserId).HasColumnName("Assigned_To_User_Id");
            b.Entity<Ticket>().Property(x => x.TicketCategoryId).HasColumnName("Ticket_Category_Id");
            b.Entity<Ticket>().Property(x => x.TicketPriorityId).HasColumnName("Ticket_Priority_Id");
            b.Entity<Ticket>().Property(x => x.StatusId).HasColumnName("Statuses_Id");
            b.Entity<Ticket>().Property(x => x.TicketDepartmentId).HasColumnName("Ticket_Department_Id");

            b.Entity<Ticket>().Property(x => x.Title).HasColumnName("Title").HasMaxLength(150).IsRequired();
            b.Entity<Ticket>().Property(x => x.Description).HasColumnName("Description").HasColumnType("varchar(max)").IsRequired();
            b.Entity<Ticket>().Property(x => x.DueDate).HasColumnName("Due_Date").HasColumnType("date");
            b.Entity<Ticket>().Property(x => x.CreatedAt).HasColumnName("Created_At");
            b.Entity<Ticket>().Property(x => x.UpdatedAt).HasColumnName("Updated_At");
            b.Entity<Ticket>().Property(x => x.ClosedAt).HasColumnName("Closed_At");
            b.Entity<Ticket>().Property(x => x.IsActive).HasColumnName("IsActive").IsRequired();

            b.Entity<Ticket>()
                .HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.Entity<Ticket>()
                .HasOne(x => x.AssignedToUser)
                .WithMany()
                .HasForeignKey(x => x.AssignedToUserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.Entity<Ticket>()
                .HasOne(x => x.TicketCategory)
                .WithMany()
                .HasForeignKey(x => x.TicketCategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            b.Entity<Ticket>()
                .HasOne(x => x.TicketPriority)
                .WithMany()
                .HasForeignKey(x => x.TicketPriorityId)
                .OnDelete(DeleteBehavior.Restrict);

            b.Entity<Ticket>()
                .HasOne(x => x.Status)
                .WithMany()
                .HasForeignKey(x => x.StatusId)
                .OnDelete(DeleteBehavior.Restrict);

            b.Entity<Ticket>()
                .HasOne(x => x.TicketDepartment)
                .WithMany()
                .HasForeignKey(x => x.TicketDepartmentId)
                .OnDelete(DeleteBehavior.Restrict);


            //--------------------------------- Tasks entitet konfiguration ---------------------------- 4
            b.Entity<TicketTask>().ToTable("Tasks");
            b.Entity<TicketTask>().HasKey(x => x.Id);

            b.Entity<TicketTask>().Property(x => x.Id).HasColumnName("Id");
            b.Entity<TicketTask>().Property(x => x.TicketId).HasColumnName("Ticket_Id");
            b.Entity<TicketTask>().Property(x => x.AssignedUserId).HasColumnName("Assigned_User_Id");
            b.Entity<TicketTask>().Property(x => x.CreatedByUserId).HasColumnName("Created_By_User_Id");
            b.Entity<TicketTask>().Property(x => x.Title).HasColumnName("Title").HasMaxLength(150).IsRequired();
            b.Entity<TicketTask>().Property(x => x.Description).HasColumnName("Description").HasColumnType("varchar(max)").IsRequired();
            b.Entity<TicketTask>().Property(x => x.StatusId).HasColumnName("Statuses_Id");
            b.Entity<TicketTask>().Property(x => x.DueDate).HasColumnName("Due_Date");
            b.Entity<TicketTask>().Property(x => x.CreatedAt).HasColumnName("Created_At");
            b.Entity<TicketTask>().Property(x => x.UpdatedAt).HasColumnName("Updated_At");
            b.Entity<TicketTask>().Property(x => x.ClosedAt).HasColumnName("Closed_At");
            b.Entity<TicketTask>().Property(x => x.IsActive).HasColumnName("IsActive").IsRequired();


            b.Entity<TicketTask>()
                .HasOne(x => x.Ticket)
                .WithMany(x => x.Tasks)
                .HasForeignKey(x => x.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            b.Entity<TicketTask>()
                .HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.Entity<TicketTask>()
                .HasOne(x => x.Status)
                .WithMany()
                .HasForeignKey(x => x.StatusId)
                .OnDelete(DeleteBehavior.Restrict);

            b.Entity<TicketTask>()
                .HasOne(x => x.AssignedUser)
                .WithMany()
                .HasForeignKey(x => x.AssignedUserId)
                .OnDelete(DeleteBehavior.Restrict);


            //------------------------------ Notifications entitet konfiguration ------------------------------ 5
            b.Entity<Notification>().ToTable("Notifications");
            b.Entity<Notification>().HasKey(x => x.Id);

            b.Entity<Notification>().Property(x => x.Id).HasColumnName("Id");
            b.Entity<Notification>().Property(x => x.UserId).HasColumnName("User_Id");
            b.Entity<Notification>().Property(x => x.TicketId).HasColumnName("Ticket_Id");
            b.Entity<Notification>().Property(x => x.Type).HasColumnName("Type").HasMaxLength(50).IsRequired();
            b.Entity<Notification>().Property(x => x.Message).HasColumnName("Message").HasColumnType("varchar(max)").IsRequired();
            b.Entity<Notification>().Property(x => x.IsRead).HasColumnName("Is_Read").IsRequired();
            b.Entity<Notification>().Property(x => x.CreatedAt).HasColumnName("Created_At").IsRequired();

            b.Entity<Notification>()
                .HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.Entity<Notification>()
                .HasOne(x => x.Ticket)
                .WithMany()
                .HasForeignKey(x => x.TicketId)
                .OnDelete(DeleteBehavior.Restrict);


            // ----------------------------- Comments -----------------------------
            b.Entity<Comment>().ToTable("Comments");
            b.Entity<Comment>().HasKey(x => x.Id);

            b.Entity<Comment>().Property(x => x.Id).HasColumnName("Id");
            b.Entity<Comment>().Property(x => x.TicketId).HasColumnName("Ticket_Id");
            b.Entity<Comment>().Property(x => x.UserId).HasColumnName("User_Id");
            b.Entity<Comment>().Property(x => x.CommentText).HasColumnName("Comment_Text").HasColumnType("varchar(max)").IsRequired();
            b.Entity<Comment>().Property(x => x.CreatedAt).HasColumnName("Created_At").IsRequired();

            b.Entity<Comment>()
                .HasOne(x => x.Ticket)
                .WithMany()
                .HasForeignKey(x => x.TicketId)
                .OnDelete(DeleteBehavior.Restrict);

            b.Entity<Comment>()
                .HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            // ----------------------------- History -----------------------------
            b.Entity<HistoryEntry>().ToTable("History");
            b.Entity<HistoryEntry>().HasKey(x => x.Id);

            b.Entity<HistoryEntry>().Property(x => x.Id).HasColumnName("Id");
            b.Entity<HistoryEntry>().Property(x => x.TicketId).HasColumnName("Ticket_Id");
            b.Entity<HistoryEntry>().Property(x => x.ChangedByUserId).HasColumnName("Changed_By_User_Id");
            b.Entity<HistoryEntry>().Property(x => x.ActionType).HasColumnName("Action_Type").HasMaxLength(100).IsRequired();
            b.Entity<HistoryEntry>().Property(x => x.OldValue).HasColumnName("Old_Value").HasColumnType("varchar(max)");
            b.Entity<HistoryEntry>().Property(x => x.NewValue).HasColumnName("New_Value").HasColumnType("varchar(max)");
            b.Entity<HistoryEntry>().Property(x => x.CreatedAt).HasColumnName("Created_At").IsRequired();

            b.Entity<HistoryEntry>()
                .HasOne(x => x.Ticket)
                .WithMany()
                .HasForeignKey(x => x.TicketId)
                .OnDelete(DeleteBehavior.Restrict);

            b.Entity<HistoryEntry>()
                .HasOne(x => x.ChangedByUser)
                .WithMany()
                .HasForeignKey(x => x.ChangedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ----------------------------- Reports -----------------------------
            b.Entity<Report>().ToTable("Reports");
            b.Entity<Report>().HasKey(x => x.Id);

            b.Entity<Report>().Property(x => x.Id).HasColumnName("Id");
            b.Entity<Report>().Property(x => x.TicketId).HasColumnName("Ticket_Id");
            b.Entity<Report>().Property(x => x.CreatedByUserId).HasColumnName("Created_By_User_Id");
            b.Entity<Report>().Property(x => x.QrApprovedByUserId).HasColumnName("Qr_Approved_By_User_Id");
            b.Entity<Report>().Property(x => x.Summary).HasColumnName("Summary").HasMaxLength(255).IsRequired();
            b.Entity<Report>().Property(x => x.ResolutionText).HasColumnName("Resolution_Text").HasColumnType("varchar(max)").IsRequired();
            b.Entity<Report>().Property(x => x.CreatedAt).HasColumnName("Created_At").IsRequired();
            b.Entity<Report>().Property(x => x.QrTokenHash).HasColumnName("Qr_Token_Hash").HasMaxLength(256);
            b.Entity<Report>().Property(x => x.QrTokenExpiresAtUtc).HasColumnName("Qr_Token_Expires_At_Utc");
            b.Entity<Report>().Property(x => x.QrApprovedAtUtc).HasColumnName("Qr_Approved_At_Utc");
            b.Entity<Report>().Property(x => x.QrUsedAtUtc).HasColumnName("Qr_Used_At_Utc");
            b.Entity<Report>().Property(x => x.QrRevokedAtUtc).HasColumnName("Qr_Revoked_At_Utc");
            b.Entity<Report>().Property(x => x.AdminFeedback).HasColumnName("Admin_Feedback").HasColumnType("varchar(max)");
            b.Entity<Report>().Property(x => x.ClosedAt).HasColumnName("Closed_At");
            b.Entity<Report>().Property(x => x.CustomerEmailSentAt).HasColumnName("Customer_Email_Sent_At");
            b.Entity<Report>()
                .HasOne(x => x.Ticket)
                .WithMany(x => x.Reports)
                .HasForeignKey(x => x.TicketId)
                .OnDelete(DeleteBehavior.Restrict);

            b.Entity<Report>()
                .HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.Entity<Report>()
                .HasOne(x => x.QrApprovedByUser)
                .WithMany()
                .HasForeignKey(x => x.QrApprovedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ----------------------------- ReportEmailLog -----------------------------
            b.Entity<ReportEmailLog>().ToTable("ReportEmailLogs");
            b.Entity<ReportEmailLog>().HasKey(x => x.Id);
            b.Entity<ReportEmailLog>().Property(x => x.Id).HasColumnName("Id");
            b.Entity<ReportEmailLog>().Property(x => x.ReportId).HasColumnName("Report_Id");
            b.Entity<ReportEmailLog>().Property(x => x.SentToEmail).HasColumnName("Sent_To_Email").HasMaxLength(255).IsRequired();
            b.Entity<ReportEmailLog>().Property(x => x.SentAt).HasColumnName("Sent_At").IsRequired();
            b.Entity<ReportEmailLog>()
                .HasOne(x => x.Report)
                .WithMany(x => x.EmailLogs)
                .HasForeignKey(x => x.ReportId)
                .OnDelete(DeleteBehavior.Cascade);


            // ----------------------------- Attachments -----------------------------
            b.Entity<Attachment>().ToTable("Attachments");
            b.Entity<Attachment>().HasKey(x => x.Id);
            b.Entity<Attachment>().Property(x => x.Id).HasColumnName("Id");
            b.Entity<Attachment>().Property(x => x.TicketId).HasColumnName("Ticket_Id");
            b.Entity<Attachment>().Property(x => x.ReportId).HasColumnName("Report_Id");
            b.Entity<Attachment>().Property(x => x.UploadedByUserId).HasColumnName("Uploaded_By_User_Id");
            b.Entity<Attachment>().Property(x => x.FileName).HasColumnName("File_Name").HasMaxLength(255).IsRequired();
            b.Entity<Attachment>().Property(x => x.FilePath).HasColumnName("File_Path").HasMaxLength(500).IsRequired();
            b.Entity<Attachment>().Property(x => x.FileType).HasColumnName("File_Type").HasMaxLength(100).IsRequired();
            b.Entity<Attachment>().Property(x => x.CreatedAt).HasColumnName("Created_At").IsRequired();
            b.Entity<Attachment>()
                .HasOne(x => x.Ticket)
                .WithMany()
                .HasForeignKey(x => x.TicketId)
                .OnDelete(DeleteBehavior.Restrict);
            b.Entity<Attachment>()
                .HasOne(x => x.UploadedByUser)
                .WithMany()
                .HasForeignKey(x => x.UploadedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // SQLite: replace varchar(max) with TEXT
            if (Database.ProviderName == "Microsoft.EntityFrameworkCore.Sqlite")
            {
                foreach (var entity in b.Model.GetEntityTypes())
                    foreach (var prop in entity.GetProperties())
                        if (prop.GetColumnType() == "varchar(max)")
                            prop.SetColumnType("TEXT");
            }

            // SQL Server: Use datetime2 for all DateTime properties to avoid out-of-range errors (1753 vs 0001)
            if (Database.IsSqlServer())
            {
                foreach (var entityType in b.Model.GetEntityTypes())
                {
                    foreach (var property in entityType.GetProperties())
                    {
                        if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
                        {
                            property.SetColumnType("datetime2");
                        }
                    }
                }
            }
        }
    }
}