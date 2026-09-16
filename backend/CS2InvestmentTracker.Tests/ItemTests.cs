using CS2InvestmentTracker.Core.Models.Database;

namespace CS2InvestmentTracker.Tests;

public class ItemTests
{
    [Fact]
    public void NetProfit_takes_the_steam_fee_from_the_sell_price()
    {
        var item = new Item { Name = "Case", Quantity = 3, BuyPrice = 10M, MinSellPrice = 23M };

        Assert.Equal(10M, item.NetProfit);
        Assert.Equal(30M, item.TotalNetProfit);
        Assert.Null(Item.NetProfitOf(null, 10M));
    }

    [Fact]
    public void RealizedProfit_uses_the_net_amount_received()
    {
        var item = new Item { Name = "Case", Quantity = 4, BuyPrice = 2M, SellPrice = 3.5M, SellDate = DateTime.Today };

        Assert.Equal(6M, item.RealizedProfit);
    }

    [Fact]
    public void PercentChange_is_relative_to_the_past_price()
    {
        Assert.Equal(10M, Item.PercentChange(110M, 100M));
        Assert.Equal(-10M, Item.PercentChange(90M, 100M));
        Assert.Null(Item.PercentChange(110M, null));
        Assert.Null(Item.PercentChange(110M, 0M));
    }

    [Fact]
    public void TriggerAlert_fires_once_and_clears_only_the_reached_alert()
    {
        var item = new Item { Name = "Case", MinSellPrice = 5M, AlertAbovePrice = 4M, AlertBelowPrice = 1M };

        Assert.Contains("Case", item.TriggerAlert());
        Assert.Null(item.AlertAbovePrice);
        Assert.Equal(1M, item.AlertBelowPrice);
        Assert.Null(item.TriggerAlert());
    }

    [Fact]
    public void TriggerAlert_ignores_unreached_alerts_and_sold_items()
    {
        Assert.Null(new Item { Name = "Case", MinSellPrice = 5M, AlertAbovePrice = 6M, AlertBelowPrice = 4M }.TriggerAlert());
        Assert.Null(new Item { Name = "Case", MinSellPrice = 5M, AlertAbovePrice = 4M, SellDate = DateTime.Today }.TriggerAlert());
    }
}
