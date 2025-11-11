using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models.Database;

namespace CS2InvestmentTracker.Core.Repositories.Custom;

public class EventLogRepository : GenericRepository<EventLog>
{
    public EventLogRepository(ApplicationDbContext context) : base(context) { }

    public async Task NewEvent(ActionType action, string message) => await New(action, message, null, null);

    public async Task NewEvent(ActionType action, string message, object values) => await New(action, message, null, values);

    public async Task NewEvent(ActionType action, string message, object oldValues, object newValues) => await New(action, message, oldValues, newValues);

    private async Task New(ActionType action, string message, object? oldValues, object? newValues)
    {
        string? oldValuesJson = oldValues != null ? System.Text.Json.JsonSerializer.Serialize(oldValues) : null;
        string? newValuesJson = newValues != null ? System.Text.Json.JsonSerializer.Serialize(newValues) : null;

        var log = new EventLog
        {
            Action = action,
            Date = DateTime.Now,
            Message = message,
            OldValues = oldValuesJson,
            NewValues = newValuesJson
        };
        await AddAsync(log);
    }
}
