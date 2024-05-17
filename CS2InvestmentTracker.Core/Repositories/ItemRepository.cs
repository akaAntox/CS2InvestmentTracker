using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models;

namespace CS2InvestmentTracker.Core.Repositories;

public class ItemRepository : GenericRepository<Item>
{
    public ItemRepository(ApplicationDbContext context) : base(context) { }
}
