using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models.Database;

namespace CS2InvestmentTracker.Core.Repositories.Custom;

public class CategoryRepository : GenericRepository<Category>
{
    public CategoryRepository(ApplicationDbContext context) : base(context) { }
}
