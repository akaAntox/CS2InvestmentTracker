namespace CS2InvestmentTracker.Core.Models.Database;

public class SteamMarketPrices
{
    public int Id { get; set; }
    public int ItemId { get; set; }
    public Item Item { get; set; } = null!;
    public decimal? MinPrice { get; set; }
    public decimal? AvgPrice { get; set; }
    public int? Volume { get; set; }
    public DateTime TrackDate { get; set; }
}
