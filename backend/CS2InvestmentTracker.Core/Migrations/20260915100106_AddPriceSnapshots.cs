using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CS2InvestmentTracker.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddPriceSnapshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PriceSnapshots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ItemId = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    Date = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Quantity = table.Column<int>(type: "INTEGER", nullable: false),
                    BuyPrice = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    MinSellPrice = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    AvgSellPrice = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    SellVolume = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PriceSnapshots", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PriceSnapshots_Date",
                table: "PriceSnapshots",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_PriceSnapshots_ItemId_Date",
                table: "PriceSnapshots",
                columns: new[] { "ItemId", "Date" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PriceSnapshots");
        }
    }
}
