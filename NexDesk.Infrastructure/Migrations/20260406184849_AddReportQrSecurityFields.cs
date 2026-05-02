using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NexDesk.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReportQrSecurityFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "Qr_Approved_At_Utc",
                table: "Reports",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Qr_Approved_By_User_Id",
                table: "Reports",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Qr_Revoked_At_Utc",
                table: "Reports",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Qr_Token_Expires_At_Utc",
                table: "Reports",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Qr_Token_Hash",
                table: "Reports",
                type: "TEXT",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Qr_Used_At_Utc",
                table: "Reports",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reports_Qr_Approved_By_User_Id",
                table: "Reports",
                column: "Qr_Approved_By_User_Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Users_Qr_Approved_By_User_Id",
                table: "Reports",
                column: "Qr_Approved_By_User_Id",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Users_Qr_Approved_By_User_Id",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Reports_Qr_Approved_By_User_Id",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "Qr_Approved_At_Utc",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "Qr_Approved_By_User_Id",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "Qr_Revoked_At_Utc",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "Qr_Token_Expires_At_Utc",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "Qr_Token_Hash",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "Qr_Used_At_Utc",
                table: "Reports");
        }
    }
}
