using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models.Database;
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
}
