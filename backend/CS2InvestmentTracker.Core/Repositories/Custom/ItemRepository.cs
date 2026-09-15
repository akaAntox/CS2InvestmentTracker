using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models.Database;
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

    public async Task<List<Item>> GetItemsWithCategoryAsync()
    {
        return await context.Items
            .AsNoTracking()
            .Include(i => i.Category)
            .ToListAsync();
    }

    // Items with the same name share the market price: update only the price columns of all of them.
    // A null price keeps the value already stored.
    public Task<int> UpdatePricesByNameAsync(string name, decimal? minSellPrice, decimal? avgSellPrice, int? sellVolume)
    {
        return context.Items
            .Where(i => i.Name == name)
            .ExecuteUpdateAsync(s => s
                .SetProperty(i => i.MinSellPrice, i => minSellPrice ?? i.MinSellPrice)
                .SetProperty(i => i.AvgSellPrice, i => avgSellPrice ?? i.AvgSellPrice)
                .SetProperty(i => i.SellVolume, sellVolume));
    }

    // Check for duplicate item names and buyprice
    public async Task<bool> CheckDuplicates(string name, decimal buyPrice)
    {
        return await context.Items
            .AsNoTracking()
            .AnyAsync(i => i.Name == name && i.BuyPrice == buyPrice);
    }
}