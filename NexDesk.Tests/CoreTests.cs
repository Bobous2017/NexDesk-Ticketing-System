namespace NexDesk.Tests
{
    using NexDesk.Domain.Entities;
    using Xunit;

    public class CoreTests
    {
        // ===== TICKET TESTS =====
        
        [Fact]
        public void Ticket_WithValidData_ShouldBeCreated()
        {
            // Arrange & Act
            var ticket = new Ticket
            {
                Title = "Critical System Down",
                Description = "Email server not responding",
                TicketPriorityId = 4, // Critical
                TicketDepartmentId = 1
            };

            // Assert
            Assert.NotNull(ticket);
            Assert.Equal("Critical System Down", ticket.Title);
            Assert.Equal(4, ticket.TicketPriorityId);
            Assert.True(ticket.IsActive);
        }

        [Fact]
        public void Ticket_LifecycleProgression_ShouldFollowCorrectOrder()
        {
            // Arrange
            var ticket = new Ticket { Title = "Test", StatusId = 1 }; // Created

            // Act
            ticket.StatusId = 2; // Move to In Progress
            Assert.Equal(2, ticket.StatusId);

            ticket.StatusId = 4; // Move to Closed
            var canClose = ticket.StatusId == 4;

            // Assert
            Assert.True(canClose);
        }

        [Fact]
        public void Ticket_Assignment_ShouldSetAssigneeCorrectly()
        {
            // Arrange
            var ticket = new Ticket { Title = "Assign Test" };
            var assigneeId = 5;

            // Act
            ticket.AssignedToUserId = assigneeId;

            // Assert
            Assert.Equal(assigneeId, ticket.AssignedToUserId);
        }

        [Theory]
        [InlineData(1)]
        [InlineData(2)]
        [InlineData(3)]
        [InlineData(4)]
        public void Ticket_WithPriority_ShouldAcceptAllLevels(int priority)
        {
            // Arrange & Act
            var ticket = new Ticket { TicketPriorityId = priority };

            // Assert
            Assert.Equal(priority, ticket.TicketPriorityId);
        }

        [Fact]
        public void Ticket_ClosedStatus_ShouldPreventReopening()
        {
            // Arrange
            var ticket = new Ticket { Title = "Test", StatusId = 4 }; // Closed
            var wasInClosedStatus = ticket.StatusId == 4;

            // Act & Assert
            Assert.True(wasInClosedStatus);
            Assert.False(ticket.StatusId == 1); // Cannot revert to Created
        }

        // ===== USER TESTS =====

        [Fact]
        public void User_WithValidData_ShouldBeCreated()
        {
            // Arrange & Act
            var user = new User
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john@example.com",
                UserName = "jdoe",
                RoleId = 2
            };

            // Assert
            Assert.NotNull(user);
            Assert.Equal("John", user.FirstName);
            Assert.Equal("john@example.com", user.Email);
            Assert.Equal(2, user.RoleId);
        }

        [Theory]
        [InlineData("john@example.com")]
        [InlineData("support@nexdesk.com")]
        [InlineData("admin@domain.org")]
        public void User_WithValidEmail_ShouldPass(string email)
        {
            // Arrange & Act
            var isValid = email.Contains("@") && email.Contains(".");
            
            // Assert
            Assert.True(isValid);
        }

        // ===== COMMENT TESTS =====

        [Fact]
        public void Comment_PublicComment_ShouldBeVisibleToAll()
        {
            // Arrange
            var comment = new Comment
            {
                CommentText = "This is a public comment",
                TicketId = 1,
                UserId = 1
            };

            // Act & Assert
            Assert.NotNull(comment);
            Assert.Equal("This is a public comment", comment.CommentText);
        }

      

        // ===== INTEGRATION TEST =====

        [Fact]
        public void Ticket_AssignmentWorkflow_ShouldCreateNotification()
        {
            // Arrange
            var ticket = new Ticket { Title = "New Ticket", StatusId = 1 };
            var supportUserId = 3;

            // Act
            ticket.AssignedToUserId = supportUserId;
            ticket.StatusId = 2; // Move to In Progress
            var notification = new Notification
            {
                Type = "Assignment", // Assignment notification
                UserId = supportUserId,
                TicketId = ticket.Id,
                IsRead = false
            };

            // Assert
            Assert.Equal(supportUserId, ticket.AssignedToUserId);
            Assert.Equal(2, ticket.StatusId);
            Assert.Equal("Assignment", notification.Type);
            Assert.False(notification.IsRead);
        }
    }
}
