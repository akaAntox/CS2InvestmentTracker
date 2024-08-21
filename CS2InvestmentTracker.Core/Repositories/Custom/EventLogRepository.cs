using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models.Database;

namespace CS2InvestmentTracker.Core.Repositories.Custom;

public class EventLogRepository : GenericRepository<EventLog>
{
    public EventLogRepository(ApplicationDbContext context) : base(context) { }
}
