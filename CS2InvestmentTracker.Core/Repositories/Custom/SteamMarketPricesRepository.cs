using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models.Database;
using Microsoft.EntityFrameworkCore;

namespace CS2InvestmentTracker.Core.Repositories.Custom;

public class SteamMarketPricesRepository : GenericRepository<Item>
{
    private readonly ApplicationDbContext context;

    public SteamMarketPricesRepository(ApplicationDbContext context) : base(context)
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
}