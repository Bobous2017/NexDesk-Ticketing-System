using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NexDesk.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Permission_Level = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Statuses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Statuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Ticket_Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ticket_Categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Ticket_Departments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ticket_Departments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Ticket_Priorities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ticket_Priorities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PassWord = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RfidChip = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PasswordResetTokenExpiry = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PasswordResetToken = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PasswordResetOtp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PasswordResetOtpExpiry = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tickets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Created_By_User_Id = table.Column<int>(type: "int", nullable: false),
                    Assigned_To_User_Id = table.Column<int>(type: "int", nullable: true),
                    Ticket_Category_Id = table.Column<int>(type: "int", nullable: false),
                    Ticket_Priority_Id = table.Column<int>(type: "int", nullable: false),
                    Statuses_Id = table.Column<int>(type: "int", nullable: false),
                    Ticket_Department_Id = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "varchar(max)", nullable: false),
                    Due_Date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Updated_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Closed_At = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tickets_Statuses_Statuses_Id",
                        column: x => x.Statuses_Id,
                        principalTable: "Statuses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Ticket_Categories_Ticket_Category_Id",
                        column: x => x.Ticket_Category_Id,
                        principalTable: "Ticket_Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Ticket_Departments_Ticket_Department_Id",
                        column: x => x.Ticket_Department_Id,
                        principalTable: "Ticket_Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Ticket_Priorities_Ticket_Priority_Id",
                        column: x => x.Ticket_Priority_Id,
                        principalTable: "Ticket_Priorities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Users_Assigned_To_User_Id",
                        column: x => x.Assigned_To_User_Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Users_Created_By_User_Id",
                        column: x => x.Created_By_User_Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UserProfiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    User_Id = table.Column<int>(type: "int", nullable: false),
                    Is_Active = table.Column<bool>(type: "bit", nullable: false),
                    Last_Login_At = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Profile_Picture = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Session_Timeout_Minutes = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserProfiles_Users_User_Id",
                        column: x => x.User_Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Attachments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Ticket_Id = table.Column<int>(type: "int", nullable: false),
                    Report_Id = table.Column<int>(type: "int", nullable: true),
                    Uploaded_By_User_Id = table.Column<int>(type: "int", nullable: false),
                    File_Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    File_Path = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    File_Type = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Attachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Attachments_Tickets_Ticket_Id",
                        column: x => x.Ticket_Id,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Attachments_Users_Uploaded_By_User_Id",
                        column: x => x.Uploaded_By_User_Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Comments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Ticket_Id = table.Column<int>(type: "int", nullable: false),
                    User_Id = table.Column<int>(type: "int", nullable: false),
                    Comment_Text = table.Column<string>(type: "varchar(max)", nullable: false),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Comments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Comments_Tickets_Ticket_Id",
                        column: x => x.Ticket_Id,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Comments_Users_User_Id",
                        column: x => x.User_Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "History",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Ticket_Id = table.Column<int>(type: "int", nullable: false),
                    Changed_By_User_Id = table.Column<int>(type: "int", nullable: false),
                    Action_Type = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Old_Value = table.Column<string>(type: "varchar(max)", nullable: true),
                    New_Value = table.Column<string>(type: "varchar(max)", nullable: true),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_History", x => x.Id);
                    table.ForeignKey(
                        name: "FK_History_Tickets_Ticket_Id",
                        column: x => x.Ticket_Id,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_History_Users_Changed_By_User_Id",
                        column: x => x.Changed_By_User_Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    User_Id = table.Column<int>(type: "int", nullable: false),
                    Ticket_Id = table.Column<int>(type: "int", nullable: true),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Message = table.Column<string>(type: "varchar(max)", nullable: false),
                    Is_Read = table.Column<bool>(type: "bit", nullable: false),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Tickets_Ticket_Id",
                        column: x => x.Ticket_Id,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_User_Id",
                        column: x => x.User_Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Reports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Ticket_Id = table.Column<int>(type: "int", nullable: false),
                    Created_By_User_Id = table.Column<int>(type: "int", nullable: false),
                    Qr_Approved_By_User_Id = table.Column<int>(type: "int", nullable: true),
                    Summary = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Resolution_Text = table.Column<string>(type: "varchar(max)", nullable: false),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Qr_Token_Hash = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Qr_Token_Expires_At_Utc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Qr_Approved_At_Utc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Qr_Used_At_Utc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Qr_Revoked_At_Utc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Admin_Feedback = table.Column<string>(type: "varchar(max)", nullable: true),
                    Closed_At = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Customer_Email_Sent_At = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reports_Tickets_Ticket_Id",
                        column: x => x.Ticket_Id,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reports_Users_Created_By_User_Id",
                        column: x => x.Created_By_User_Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reports_Users_Qr_Approved_By_User_Id",
                        column: x => x.Qr_Approved_By_User_Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Tasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Ticket_Id = table.Column<int>(type: "int", nullable: false),
                    Assigned_User_Id = table.Column<int>(type: "int", nullable: true),
                    Created_By_User_Id = table.Column<int>(type: "int", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "varchar(max)", nullable: false),
                    Statuses_Id = table.Column<int>(type: "int", nullable: false),
                    Due_Date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Updated_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Closed_At = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tasks_Statuses_Statuses_Id",
                        column: x => x.Statuses_Id,
                        principalTable: "Statuses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tasks_Tickets_Ticket_Id",
                        column: x => x.Ticket_Id,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Tasks_Users_Assigned_User_Id",
                        column: x => x.Assigned_User_Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tasks_Users_Created_By_User_Id",
                        column: x => x.Created_By_User_Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReportEmailLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Report_Id = table.Column<int>(type: "int", nullable: false),
                    Sent_To_Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Sent_At = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReportEmailLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReportEmailLogs_Reports_Report_Id",
                        column: x => x.Report_Id,
                        principalTable: "Reports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_Ticket_Id",
                table: "Attachments",
                column: "Ticket_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_Uploaded_By_User_Id",
                table: "Attachments",
                column: "Uploaded_By_User_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_Ticket_Id",
                table: "Comments",
                column: "Ticket_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_User_Id",
                table: "Comments",
                column: "User_Id");

            migrationBuilder.CreateIndex(
                name: "IX_History_Changed_By_User_Id",
                table: "History",
                column: "Changed_By_User_Id");

            migrationBuilder.CreateIndex(
                name: "IX_History_Ticket_Id",
                table: "History",
                column: "Ticket_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_Ticket_Id",
                table: "Notifications",
                column: "Ticket_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_User_Id",
                table: "Notifications",
                column: "User_Id");

            migrationBuilder.CreateIndex(
                name: "IX_ReportEmailLogs_Report_Id",
                table: "ReportEmailLogs",
                column: "Report_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_Created_By_User_Id",
                table: "Reports",
                column: "Created_By_User_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_Qr_Approved_By_User_Id",
                table: "Reports",
                column: "Qr_Approved_By_User_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_Ticket_Id",
                table: "Reports",
                column: "Ticket_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Name",
                table: "Roles",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Statuses_Name",
                table: "Statuses",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_Assigned_User_Id",
                table: "Tasks",
                column: "Assigned_User_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_Created_By_User_Id",
                table: "Tasks",
                column: "Created_By_User_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_Statuses_Id",
                table: "Tasks",
                column: "Statuses_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_Ticket_Id",
                table: "Tasks",
                column: "Ticket_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_Categories_Name",
                table: "Ticket_Categories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_Departments_Name",
                table: "Ticket_Departments",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_Priorities_Name",
                table: "Ticket_Priorities",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Assigned_To_User_Id",
                table: "Tickets",
                column: "Assigned_To_User_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Created_By_User_Id",
                table: "Tickets",
                column: "Created_By_User_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Statuses_Id",
                table: "Tickets",
                column: "Statuses_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Ticket_Category_Id",
                table: "Tickets",
                column: "Ticket_Category_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Ticket_Department_Id",
                table: "Tickets",
                column: "Ticket_Department_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Ticket_Priority_Id",
                table: "Tickets",
                column: "Ticket_Priority_Id");

            migrationBuilder.CreateIndex(
                name: "IX_UserProfiles_User_Id",
                table: "UserProfiles",
                column: "User_Id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_RoleId",
                table: "Users",
                column: "RoleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Attachments");

            migrationBuilder.DropTable(
                name: "Comments");

            migrationBuilder.DropTable(
                name: "History");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "ReportEmailLogs");

            migrationBuilder.DropTable(
                name: "Tasks");

            migrationBuilder.DropTable(
                name: "UserProfiles");

            migrationBuilder.DropTable(
                name: "Reports");

            migrationBuilder.DropTable(
                name: "Tickets");

            migrationBuilder.DropTable(
                name: "Statuses");

            migrationBuilder.DropTable(
                name: "Ticket_Categories");

            migrationBuilder.DropTable(
                name: "Ticket_Departments");

            migrationBuilder.DropTable(
                name: "Ticket_Priorities");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Roles");
        }
    }
}
