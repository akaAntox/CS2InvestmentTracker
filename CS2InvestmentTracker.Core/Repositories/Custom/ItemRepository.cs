using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models.Database;

namespace CS2InvestmentTracker.Core.Repositories.Custom;

public class ItemRepository : GenericRepository<Item>
{
    public ItemRepository(ApplicationDbContext context) : base(context) { }
}
