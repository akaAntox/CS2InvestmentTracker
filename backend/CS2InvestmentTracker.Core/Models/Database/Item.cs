using System.ComponentModel.DataAnnotations.Schema;

namespace CS2InvestmentTracker.Core.Models.Database;

public class Item
{
    // Steam keeps ~15% of what the buyer pays (5% Steam + 10% CS2): the seller receives price / 1.15
    private const decimal SteamFeeMultiplier = 1.15M;

    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal BuyPrice { get; set; } = 0;
    public decimal TotalBuyPrice => BuyPrice * Quantity;
    public decimal? MinSellPrice { get; set; }
    public decimal? AvgSellPrice { get; set; }
    public int? SellVolume { get; set; }
    public decimal? TotalMinSellPrice => MinSellPrice * Quantity;
    public decimal? NetProfit => NetProfitOf(MinSellPrice, BuyPrice);
    public static decimal? NetProfitOf(decimal? minSellPrice, decimal buyPrice) => minSellPrice / SteamFeeMultiplier - buyPrice;
    public decimal? TotalNetProfit => NetProfit * Quantity;
    public decimal? PercentNetProfit
    {
        get
        {
            if (BuyPrice != 0)
                return NetProfit / BuyPrice * 100;
            else
                return 100;
        }
    }
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }
    public DateTime InsertDate { get; set; }
    public DateTime? EditDate { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime? PriceUpdateDate { get; set; }

    // Sale: SellPrice is the net amount received per unit. Sold items are no longer price-tracked.
    public decimal? SellPrice { get; set; }
    public DateTime? SellDate { get; set; }
    public decimal? RealizedProfit => (SellPrice - BuyPrice) * Quantity;

    // One-shot alerts on MinSellPrice: cleared once they fire
    public decimal? AlertAbovePrice { get; set; }
    public decimal? AlertBelowPrice { get; set; }

    // MinSellPrice change in % vs 1, 7 and 30 days before the last price update, from the price history
    [NotMapped] public decimal? Change1d { get; set; }
    [NotMapped] public decimal? Change7d { get; set; }
    [NotMapped] public decimal? Change30d { get; set; }

    public static decimal? PercentChange(decimal? current, decimal? past) =>
        current is null || past is null or 0M ? null : (current - past) / past * 100;

    // Fires the alert reached by the current price and clears it; null when none fired
    public string? TriggerAlert()
    {
        if (SellDate != null || MinSellPrice is not decimal price) return null;

        if (price >= AlertAbovePrice)
        {
            var message = $"{Name}: {price:0.00}€ reached the alert above {AlertAbovePrice:0.00}€";
            AlertAbovePrice = null;
            return message;
        }

        if (price <= AlertBelowPrice)
        {
            var message = $"{Name}: {price:0.00}€ reached the alert below {AlertBelowPrice:0.00}€";
            AlertBelowPrice = null;
            return message;
        }

        return null;
    }
}
