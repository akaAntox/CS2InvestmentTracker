using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models.Database;

namespace CS2InvestmentTracker.Core.Repositories.Custom;

public class ItemRepository : GenericRepository<Item>
{
    private readonly ApplicationDbContext context;

    public ItemRepository(ApplicationDbContext context) : base(context)
    {
        this.context = context;
    }
}
