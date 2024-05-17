namespace CS2InvestmentTracker.Core.Models;

public class Item
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public decimal BuyPrice { get; set; } = 0;
    public decimal TotalBuyPrice => BuyPrice * Quantity;
    public decimal? MinSellPrice { get; set; }
    public decimal? AvgSellPrice { get; set; }
    public decimal? TotalMinSellPrice => MinSellPrice * Quantity;
    public decimal? NetProfit => MinSellPrice - BuyPrice * 1.15M;
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
}
