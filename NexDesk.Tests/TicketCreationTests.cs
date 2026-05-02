using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using NexDesk.API.Controllers.Crud.Tickets;
using NexDesk.Domain.Entities;
using NexDesk.Domain.IServices;
using NexDesk.Infrastructure;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace NexDesk.Tests
{
    public class TicketCreationTests
    {
        private NexDeskDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<NexDeskDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            var context = new NexDeskDbContext(options);

            context.Users.AddRange(
                new User
                {
                    Id = 1,
                    FirstName = "Admin",
                    LastName = "User",
                    UserName = "admin",
                    Email = "admin@test.dk"
                },
                new User
                {
                    Id = 2,
                    FirstName = "Support",
                    LastName = "User",
                    UserName = "support",
                    Email = "support@test.dk"
                }
            );

            context.TicketCategories.Add(new TicketCategory
            {
                Id = 1,
                Name = "Hardware"
            });

            context.TicketPriorities.Add(new TicketPriority
            {
                Id = 1,
                Name = "High"
            });

            context.Statuses.Add(new Status
            {
                Id = 1,
                Name = "Open"
            });

            context.TicketDepartments.Add(new TicketDepartment
            {
                Id = 1,
                Name = "IT"
            });

            context.SaveChanges();
            return context;
        }

        private TicketsController GetController(
            NexDeskDbContext context,
            Mock<IEmailService>? emailMock = null,
            Mock<INotificationService>? notificationMock = null)
        {
            emailMock ??= new Mock<IEmailService>();
            notificationMock ??= new Mock<INotificationService>();

            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["AdminWeb:BaseUrl"] = "http://localhost:5292"
                })
                .Build();

            return new TicketsController(
                context,
                emailMock.Object,
                config,
                notificationMock.Object
            );
        }

        [Fact] // This test verifies that a ticket is created and a notification is sent when a ticket is created without an assigned user.
        public async Task Should_Create_Ticket_And_Send_Created_Notification()
        {
            var context = GetInMemoryDbContext();
            var emailMock = new Mock<IEmailService>();
            var notificationMock = new Mock<INotificationService>();

            var controller = GetController(context, emailMock, notificationMock);

            var ticket = new Ticket
            {
                CreatedByUserId = 1,
                AssignedToUserId = null,
                TicketCategoryId = 1,
                TicketPriorityId = 1,
                StatusId = 1,
                TicketDepartmentId = 1,
                Title = "Create Ticket", // This  will fail if  use the wrong:  "Wrong title"
                Description = "User cannot login to account, The  ticket ca not be created"
            };

            var result = await controller.Create(ticket);

            var created = Assert.IsType<CreatedAtActionResult>(result);
            var savedTicket = Assert.IsType<Ticket>(created.Value);

            Assert.NotNull(savedTicket);
            Assert.Equal("Create Ticket", savedTicket.Title);
            Assert.True(savedTicket.IsActive);

            var dbTicket = await context.TicketTask.FirstOrDefaultAsync();
            Assert.NotNull(dbTicket);
            Assert.Equal("Create Ticket", dbTicket!.Title);

            notificationMock.Verify(x =>
                x.NotifyTicketCreatedAsync(1, dbTicket.Id, "Create Ticket"),
                Times.Once);
        }

        [Fact] // This test verifies that a ticket is created and a notification is sent when a ticket is created with an assigned user.
        public async Task Should_Create_Ticket_And_Send_Assignment_Notification_When_Assigned()
        {
            var context = GetInMemoryDbContext();
            var emailMock = new Mock<IEmailService>();
            var notificationMock = new Mock<INotificationService>();

            var controller = GetController(context, emailMock, notificationMock);

            var ticket = new Ticket
            {
                CreatedByUserId = 1,
                AssignedToUserId = 2,
                TicketCategoryId = 1,
                TicketPriorityId = 1,
                StatusId = 1,
                TicketDepartmentId = 1,
                Title = "Printer issue",
                Description = "Office printer is offline"
            };

            var result = await controller.Create(ticket);

            var created = Assert.IsType<CreatedAtActionResult>(result);
            var savedTicket = Assert.IsType<Ticket>(created.Value);

            Assert.NotNull(savedTicket);

            var dbTicket = await context.TicketTask.FirstOrDefaultAsync();
            Assert.NotNull(dbTicket);

            notificationMock.Verify(x =>
                x.NotifyTicketCreatedAsync(1, dbTicket!.Id, "Printer issue"),
                Times.Once);

            notificationMock.Verify(x =>
                x.NotifyTicketAssignedAsync(2, dbTicket.Id, "Printer issue"),
                Times.Once);
        }
    }
}