using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CS2InvestmentTracker.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddSalesAndAlerts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AlertAbovePrice",
                table: "Items",
                type: "TEXT",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AlertBelowPrice",
                table: "Items",
                type: "TEXT",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PriceUpdateDate",
                table: "Items",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SellDate",
                table: "Items",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SellPrice",
                table: "Items",
                type: "TEXT",
                precision: 18,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AlertAbovePrice",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "AlertBelowPrice",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "PriceUpdateDate",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "SellDate",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "SellPrice",
                table: "Items");
        }
    }
}
