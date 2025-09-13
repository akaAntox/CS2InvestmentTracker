using CS2InvestmentTracker.Core.Models.Database;

namespace CS2InvestmentTracker.Core.Models.DTOs;

public class ItemDto
{
    public string Name { get; set; }
    public string? Description { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal BuyPrice { get; set; } = 0;
    public int CategoryId { get; set; }
}

public class ItemCreateDto : ItemDto { }

public class ItemUpdateDto : ItemDto 
{
    public int Id { get; set; }
}

public class ItemReadDto : ItemDto
{
    public int Id { get; set; }
    public decimal TotalBuyPrice { get; set; }
    public decimal? MinSellPrice { get; set; }
    public decimal? AvgSellPrice { get; set; }
    public decimal? TotalMinSellPrice { get; set; }
    public decimal? NetProfit { get; set; }
    public decimal? TotalNetProfit { get; set; }
    public decimal? PercentNetProfit { get; set; }
    public Category? Category { get; set; }
    public DateTime InsertDate { get; set; }
    public DateTime? EditDate { get; set; }
}