using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NexDesk.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPermissionLevelAndSessionTimeout : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Session_Timeout_Minutes",
                table: "UserProfiles",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Permission_Level",
                table: "Roles",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Session_Timeout_Minutes",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "Permission_Level",
                table: "Roles");
        }
    }
}
