namespace CS2InvestmentTracker.Core.Models.DTOs;

public class CategorySummaryDto
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public int ItemCount { get; set; }
    public int TotalQuantity { get; set; }
    public decimal TotalBuyPrice { get; set; }
    public decimal? TotalMinSellPrice { get; set; }
    public decimal? TotalNetProfit { get; set; }
    public decimal? AveragePercentProfit { get; set; }
    public string? BestItem { get; set; }
    public string? WorstItem { get; set; }
}
