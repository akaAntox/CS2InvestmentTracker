using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace CS2InvestmentTracker.Core.Repositories.Custom;

public class ItemRepository : GenericRepository<Item>
{
    private readonly ApplicationDbContext context;

    public ItemRepository(ApplicationDbContext context) : base(context)
    {
        this.context = context;
    }

    public async Task<List<Item>> GetItemsByNameAsync(string name)
    {
        return await context.Items
            .AsNoTracking()
            .Where(i => i.Name.Contains(name))
            .ToListAsync();
    }

    // All items; unsold ones also get their price change vs 1, 7 and 30 days before the last price update
    public async Task<List<Item>> GetItemsWithCategoryAsync()
    {
        var items = await context.Items
            .AsNoTracking()
            .Include(i => i.Category)
            .ToListAsync();

        // Same name, same market price. The extra days cover days without a snapshot.
        var from = DateOnly.FromDateTime(DateTime.Now).AddDays(-40);
        var snapshots = await context.PriceSnapshots
            .AsNoTracking()
            .Where(s => s.Date >= from && s.MinSellPrice != null)
            .Select(s => new { s.Name, s.Date, s.MinSellPrice })
            .ToListAsync();
        var pricesByName = snapshots
            .GroupBy(s => s.Name)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(s => s.Date).ToList());

        foreach (var item in items.Where(i => i.SellDate == null))
        {
            if (!pricesByName.TryGetValue(item.Name, out var prices)) continue;

            var priceDay = DateOnly.FromDateTime(item.PriceUpdateDate ?? DateTime.Now);
            decimal? PriceDaysAgo(int days) => prices.FirstOrDefault(s => s.Date <= priceDay.AddDays(-days))?.MinSellPrice;

            item.Change1d = Item.PercentChange(item.MinSellPrice, PriceDaysAgo(1));
            item.Change7d = Item.PercentChange(item.MinSellPrice, PriceDaysAgo(7));
            item.Change30d = Item.PercentChange(item.MinSellPrice, PriceDaysAgo(30));
        }

        return items;
    }

    public Task<List<Item>> GetUnsoldItemsAsync()
    {
        return context.Items
            .AsNoTracking()
            .Where(i => i.SellDate == null)
            .ToListAsync();
    }

    // Items with the same name share the market price: update only the price columns of the unsold ones.
    // A null price keeps the value already stored.
    public Task<int> UpdatePricesByNameAsync(string name, decimal? minSellPrice, decimal? avgSellPrice, int? sellVolume)
    {
        DateTime? now = DateTime.Now;
        return context.Items
            .Where(i => i.Name == name && i.SellDate == null)
            .ExecuteUpdateAsync(s => s
                .SetProperty(i => i.MinSellPrice, i => minSellPrice ?? i.MinSellPrice)
                .SetProperty(i => i.AvgSellPrice, i => avgSellPrice ?? i.AvgSellPrice)
                .SetProperty(i => i.SellVolume, sellVolume)
                .SetProperty(i => i.PriceUpdateDate, now));
    }

    // Copies every unsold item's holding and prices into the history for the given day.
    // Running again on the same day overwrites that day.
    public async Task SaveSnapshotAsync(DateOnly date)
    {
        var snapshots = await context.Items
            .AsNoTracking()
            .Where(i => i.SellDate == null)
            .Select(i => new PriceSnapshot
            {
                ItemId = i.Id,
                Name = i.Name,
                Date = date,
                Quantity = i.Quantity,
                BuyPrice = i.BuyPrice,
                MinSellPrice = i.MinSellPrice,
                AvgSellPrice = i.AvgSellPrice,
                SellVolume = i.SellVolume
            })
            .ToListAsync();

        await using var transaction = await context.Database.BeginTransactionAsync();
        await context.PriceSnapshots.Where(s => s.Date == date).ExecuteDeleteAsync();
        context.PriceSnapshots.AddRange(snapshots);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
    }

    public Task<bool> HasSnapshotAsync(DateOnly date)
    {
        return context.PriceSnapshots.AnyAsync(s => s.Date == date);
    }

    public Task<List<PriceSnapshot>> GetItemHistoryAsync(int itemId)
    {
        return context.PriceSnapshots
            .AsNoTracking()
            .Where(s => s.ItemId == itemId)
            .OrderBy(s => s.Date)
            .ToListAsync();
    }

    public async Task<List<PortfolioHistoryDto>> GetPortfolioHistoryAsync()
    {
        // ponytail: summed in memory like CategoryRepository, since SQLite stores decimals as TEXT.
        // Move the sums into SQL casting to REAL if years of history make this slow.
        var rows = await context.PriceSnapshots
            .AsNoTracking()
            .Select(s => new { s.Date, s.Quantity, s.BuyPrice, s.MinSellPrice })
            .ToListAsync();

        var sales = await context.Items
            .AsNoTracking()
            .Where(i => i.SellDate != null)
            .ToListAsync();

        return rows
            .GroupBy(s => s.Date)
            .OrderBy(g => g.Key)
            .Select(g => new PortfolioHistoryDto(
                g.Key,
                g.Sum(s => s.BuyPrice * s.Quantity),
                g.Sum(s => (s.MinSellPrice ?? 0) * s.Quantity),
                g.Sum(s => (Item.NetProfitOf(s.MinSellPrice, s.BuyPrice) ?? 0) * s.Quantity),
                // Cumulative: every sale made up to that day
                sales.Where(i => DateOnly.FromDateTime(i.SellDate!.Value) <= g.Key).Sum(i => i.RealizedProfit ?? 0)))
            .ToList();
    }

    // Selling part of a lot splits it: the sold units become a new item and the rest stays tracked.
    // The item must be tracked by this context (e.g. loaded with GetByIdAsync).
    public async Task<Item> SellAsync(Item item, int quantity, decimal sellPrice, DateTime sellDate)
    {
        var sold = item;
        if (quantity < item.Quantity)
        {
            item.Quantity -= quantity;
            sold = new Item
            {
                Name = item.Name,
                Description = item.Description,
                Quantity = quantity,
                BuyPrice = item.BuyPrice,
                MinSellPrice = item.MinSellPrice,
                AvgSellPrice = item.AvgSellPrice,
                SellVolume = item.SellVolume,
                CategoryId = item.CategoryId,
                InsertDate = item.InsertDate,
                ImageUrl = item.ImageUrl,
                PriceUpdateDate = item.PriceUpdateDate
            };
            context.Items.Add(sold);
        }

        sold.SellPrice = sellPrice;
        sold.SellDate = sellDate;
        await context.SaveChangesAsync();
        return sold;
    }

    // Fires the alerts reached by the current prices, clearing them, and returns their messages
    public async Task<List<string>> TriggerAlertsAsync()
    {
        var items = await context.Items
            .Where(i => i.SellDate == null && (i.AlertAbovePrice != null || i.AlertBelowPrice != null))
            .ToListAsync();

        var messages = items.Select(i => i.TriggerAlert()).OfType<string>().ToList();
        await context.SaveChangesAsync();
        return messages;
    }

    // Check for duplicate item names and buyprice among the items not sold yet
    public async Task<bool> CheckDuplicates(string name, decimal buyPrice)
    {
        return await context.Items
            .AsNoTracking()
            .AnyAsync(i => i.Name == name && i.BuyPrice == buyPrice && i.SellDate == null);
    }
}
