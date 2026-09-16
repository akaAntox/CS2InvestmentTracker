namespace CS2InvestmentTracker.Core.Models.DTOs;

public record PortfolioHistoryDto(DateOnly Date, decimal TotalBuyPrice, decimal TotalMinSellPrice, decimal TotalNetProfit, decimal RealizedProfit);
