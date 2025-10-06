namespace CS2InvestmentTracker.Core.Models.Database;

public class Category
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
}
