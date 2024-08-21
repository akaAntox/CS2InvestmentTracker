using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CS2InvestmentTracker.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddedDescriptionsActionType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Items",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<int>(
                name: "Action",
                table: "EventLogs",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldDefaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Categories",
                type: "TEXT",
                maxLength: 200,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Categories");

            migrationBuilder.AlterColumn<string>(
                name: "Action",
                table: "EventLogs",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(int),
                oldType: "INTEGER");
        }
    }
}
