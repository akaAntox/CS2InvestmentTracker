namespace CS2InvestmentTracker.Core.Models.Database;

public enum ActionType
{
    Insert,
    Update,
    Delete
}

public class EventLog
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public ActionType Action { get; set; }
    public string Message { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
}
