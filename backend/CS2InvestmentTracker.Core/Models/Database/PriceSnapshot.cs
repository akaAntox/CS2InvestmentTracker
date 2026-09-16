namespace CS2InvestmentTracker.Core.Models.Database;

// Daily copy of an item's holding and market price. No FK: history survives item deletion.
public class PriceSnapshot
{
    public int Id { get; set; }
    public int ItemId { get; set; }
    public required string Name { get; set; }
    public DateOnly Date { get; set; }
    public int Quantity { get; set; }
    public decimal BuyPrice { get; set; }
    public decimal? MinSellPrice { get; set; }
    public decimal? AvgSellPrice { get; set; }
    public int? SellVolume { get; set; }
}
