namespace CS2InvestmentTracker.Core.Models;

public class EventLog
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
}
