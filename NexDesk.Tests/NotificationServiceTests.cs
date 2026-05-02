using NexDesk.Domain.Entities;
using NexDesk.Domain.IServices;
using NexDesk.Infrastructure;
using NexDesk.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace NexDesk.Tests
{
    public class NotificationServiceTests
    {
        private NexDeskDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<NexDeskDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            var context = new NexDeskDbContext(options);

            context.Users.Add(new User
            {
                Id = 1,
                FirstName = "Bobo",
                LastName = "Limpoge",
                UserName = "bobo",
                Email = "bobo@test.dk"
            });

            context.TicketTask.Add(new Ticket
            {
                Id = 19,
                CreatedByUserId = 1,
                Title = "Test Ticket",
                Description = "Test Description",
                TicketCategoryId = 1,
                TicketPriorityId = 1,
                StatusId = 1,
                TicketDepartmentId = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            });

            context.SaveChanges();
            return context;
        }

   

        [Fact] // This test verifies that a notification is created when a ticket is created.
        public async Task Should_Create_TicketCreated_Notification()
        {
            var context = GetInMemoryDbContext();
            var service = new NotificationService(context);

            await service.NotifyTicketCreatedAsync(1, 19, "Test Ticket");

            var notification = await context.Notifications.FirstOrDefaultAsync();

            Assert.NotNull(notification);
            Assert.Equal(1, notification.UserId);
            Assert.Equal(19, notification.TicketId);
            Assert.Equal("TicketCreated", notification.Type);
            Assert.Contains("Ticket #19 was created", notification.Message);
        }

        [Fact] // This test verifies that a notification is created when a ticket is assigned to a user.
        public async Task Should_Create_Notification()
        {
            var context = GetInMemoryDbContext();
            var service = new NotificationService(context);

            await service.CreateAsync(1, "Assignment", "You have been assigned to ticket #19.", 19);

            var notification = await context.Notifications.FirstOrDefaultAsync();

            Assert.NotNull(notification);
            Assert.Equal(1, notification.UserId);
            Assert.Equal(19, notification.TicketId);
            Assert.Equal("Assignment", notification.Type);
            Assert.Equal("You have been assigned to ticket #19.", notification.Message);
            Assert.False(notification.IsRead);
        }

        [Fact] // This test verifies that a notification is created when a ticket is assigned to a user.
        public async Task Should_Create_TicketAssigned_Notification()
        {
            var context = GetInMemoryDbContext();
            var service = new NotificationService(context);

            await service.NotifyTicketAssignedAsync(1, 19, "Test Ticket");

            var notification = await context.Notifications.FirstOrDefaultAsync();

            Assert.NotNull(notification);
            Assert.Equal("Assignment", notification.Type);
            Assert.Contains("assigned", notification.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact] // This test verifies that a notification is created when a ticket is assigned to a user.
        public async Task Should_Create_TicketUpdated_Notification()
        {
            var context = GetInMemoryDbContext();
            var service = new NotificationService(context);

            await service.NotifyTicketUpdatedAsync(1, 19, "Test Ticket");

            var notification = await context.Notifications.FirstOrDefaultAsync();

            Assert.NotNull(notification);
            Assert.Equal("Update", notification.Type);
            Assert.Contains("updated", notification.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact] // This test verifies that a notification is created when a ticket is closed.
        public async Task Should_Create_TicketClosed_Notification()
        {
            var context = GetInMemoryDbContext();
            var service = new NotificationService(context);

            await service.NotifyTicketClosedAsync(1, 19, "Test Ticket");

            var notification = await context.Notifications.FirstOrDefaultAsync();

            Assert.NotNull(notification);
            Assert.Equal("Resolved", notification.Type);
            Assert.Contains("closed", notification.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact] // This test verifies that a notification is created when a task is created.
        public async Task Should_Create_TaskCreated_Notification()
        {
            var context = GetInMemoryDbContext();
            var service = new NotificationService(context);

            await service.NotifyTaskCreatedAsync(1, 19, "Fix login bug");

            var notification = await context.Notifications.FirstOrDefaultAsync();

            Assert.NotNull(notification);
            Assert.Equal("TaskCreated", notification.Type);
            Assert.Contains("Fix login bug", notification.Message);
        }

        [Fact] // This test verifies that a notification is created when a comment is added to a ticket.
        public async Task Should_Create_CommentAdded_Notification()
        {
            var context = GetInMemoryDbContext();
            var service = new NotificationService(context);

            await service.NotifyCommentAddedAsync(1, 19, "Test Ticket");

            var notification = await context.Notifications.FirstOrDefaultAsync();

            Assert.NotNull(notification);
            Assert.Equal("CommentAdded", notification.Type);
            Assert.Contains("comment", notification.Message, StringComparison.OrdinalIgnoreCase);
        }
    }
}