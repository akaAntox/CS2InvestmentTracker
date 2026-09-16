using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace CS2InvestmentTracker.Core.Repositories.Custom;

public class CategoryRepository : GenericRepository<Category>
{
    private readonly ApplicationDbContext context;

    public CategoryRepository(ApplicationDbContext context) : base(context)
    {
        this.context = context;
    }

    public async Task<List<Category>> GetCategoriesByNameAsync(string name)
    {
        return await context.Categories
            .AsNoTracking()
            .Where(c => c.Name.Contains(name))
            .ToListAsync();
    }

    public async Task<List<CategorySummaryDto>> GetCategoriesWithSummaryAsync()
    {
        // We must compute everything in-memory because SQLite doesn't support
        // complex aggregates with conditional ordering inside a GroupJoin projection.
        var categories = await context.Categories
            .AsNoTracking()
            .ToListAsync();

        // Sold items are no longer holdings
        var items = await context.Items
            .AsNoTracking()
            .Where(i => i.SellDate == null)
            .ToListAsync();

        var itemsByCategory = items
            .Where(i => i.CategoryId != null)
            .GroupBy(i => i.CategoryId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        var result = categories.Select(cat =>
        {
            var catItems = itemsByCategory.GetValueOrDefault(cat.Id, []);

            // Items with valid profit data (MinSellPrice set and BuyPrice > 0)
            var profitableItems = catItems
                .Where(i => i.MinSellPrice.HasValue && i.BuyPrice != 0)
                .ToList();
            var profitableCost = profitableItems.Sum(i => i.TotalBuyPrice);

            return new CategorySummaryDto
            {
                Id = cat.Id,
                Name = cat.Name,
                Description = cat.Description,
                ItemCount = catItems.Count,
                TotalQuantity = catItems.Sum(i => i.Quantity),
                TotalBuyPrice = catItems.Sum(i => i.BuyPrice * i.Quantity),
                TotalMinSellPrice = catItems.Any(i => i.MinSellPrice.HasValue)
                    ? catItems.Sum(i => (i.MinSellPrice ?? 0) * i.Quantity)
                    : null,
                TotalNetProfit = catItems.Any(i => i.TotalNetProfit.HasValue)
                    ? catItems.Sum(i => i.TotalNetProfit ?? 0)
                    : null,
                // Weighted by cost: a 0.03€ item must not count as much as a 500€ one
                AveragePercentProfit = profitableCost > 0
                    ? profitableItems.Sum(i => i.TotalNetProfit ?? 0) / profitableCost * 100
                    : null,
                BestItem = profitableItems
                    .OrderByDescending(i => i.PercentNetProfit)
                    .Select(i => i.Name)
                    .FirstOrDefault(),
                WorstItem = profitableItems
                    .OrderBy(i => i.PercentNetProfit)
                    .Select(i => i.Name)
                    .FirstOrDefault(),
            };
        }).ToList();

        return result;
    }
}
