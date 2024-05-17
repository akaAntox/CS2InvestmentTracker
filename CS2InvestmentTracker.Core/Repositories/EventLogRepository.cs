using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models;

namespace CS2InvestmentTracker.Core.Repositories;

public class EventLogRepository : GenericRepository<EventLog>
{
    public EventLogRepository(ApplicationDbContext context) : base(context) { }
}
