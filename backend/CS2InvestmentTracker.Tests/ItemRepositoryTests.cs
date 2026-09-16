using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Repositories.Custom;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace CS2InvestmentTracker.Tests;

// Real SQLite in memory with the schema built by the migrations,
// so this also fails when the model changes without a migration.
public sealed class ItemRepositoryTests : IDisposable
{
    private readonly SqliteConnection connection = new("DataSource=:memory:");
    private readonly ApplicationDbContext context;
    private readonly ItemRepository repository;

    public ItemRepositoryTests()
    {
        connection.Open();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite(connection).Options;
        context = new ApplicationDbContext(options, null!);
        context.Database.Migrate();
        repository = new ItemRepository(context);
    }

    public void Dispose()
    {
        context.Dispose();
        connection.Dispose();
    }

    private Task<Item> AddAsync(string name, int quantity, decimal buyPrice, decimal? minSellPrice) =>
        repository.AddAsync(new Item
        {
            Name = name,
            Quantity = quantity,
            BuyPrice = buyPrice,
            MinSellPrice = minSellPrice,
            InsertDate = DateTime.Now
        });

    [Fact]
    public async Task SellAsync_splits_a_partial_sale_into_a_sold_item()
    {
        var item = await AddAsync("Case", 10, 1M, 2M);

        var sold = await repository.SellAsync(item, 4, 1.5M, DateTime.Today);

        Assert.NotEqual(item.Id, sold.Id);
        Assert.Equal(6, (await repository.GetUnsoldItemsAsync()).Single().Quantity);
        Assert.Equal(4, sold.Quantity);
        Assert.Equal(2M, sold.RealizedProfit);
    }

    [Fact]
    public async Task PortfolioHistory_leaves_out_sold_items_and_adds_realized_profit()
    {
        await AddAsync("Case", 2, 10M, 23M);
        var knife = await AddAsync("Knife", 1, 100M, 150M);
        var today = DateOnly.FromDateTime(DateTime.Now);

        await repository.SaveSnapshotAsync(today.AddDays(-1));
        await repository.SellAsync(knife, 1, 130M, DateTime.Now);
        await repository.SaveSnapshotAsync(today);
        await repository.SaveSnapshotAsync(today); // same day again overwrites

        var history = await repository.GetPortfolioHistoryAsync();

        Assert.Equal(2, history.Count);
        Assert.Equal(120M, history[0].TotalBuyPrice);
        Assert.Equal(0M, history[0].RealizedProfit);
        Assert.Equal(20M, history[1].TotalBuyPrice);
        Assert.Equal(46M, history[1].TotalMinSellPrice);
        Assert.Equal(20M, history[1].TotalNetProfit); // 2 × (23 / 1.15 − 10)
        Assert.Equal(30M, history[1].RealizedProfit);
    }

    [Fact]
    public async Task Items_get_price_changes_from_past_snapshots()
    {
        await AddAsync("Case", 1, 1M, 2M);
        var today = DateOnly.FromDateTime(DateTime.Now);
        await repository.SaveSnapshotAsync(today.AddDays(-7));
        await repository.UpdatePricesByNameAsync("Case", 2.5M, null, 10);

        var item = (await repository.GetItemsWithCategoryAsync()).Single();

        Assert.Equal(25M, item.Change1d); // closest snapshot before yesterday
        Assert.Equal(25M, item.Change7d);
        Assert.Null(item.Change30d);
    }

    [Fact]
    public async Task TriggerAlertsAsync_saves_the_cleared_alerts()
    {
        var item = await AddAsync("Case", 1, 1M, 5M);
        item.AlertAbovePrice = 4M;
        await repository.UpdateAsync(item);

        Assert.Single(await repository.TriggerAlertsAsync());
        Assert.Empty(await repository.TriggerAlertsAsync());
    }
}
