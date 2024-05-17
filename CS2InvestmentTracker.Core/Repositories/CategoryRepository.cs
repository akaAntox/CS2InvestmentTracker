using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models;

namespace CS2InvestmentTracker.Core.Repositories;

public class CategoryRepository : GenericRepository<Category>
{
    public CategoryRepository(ApplicationDbContext context) : base(context) { }
}
