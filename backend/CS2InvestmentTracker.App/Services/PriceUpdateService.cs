using CS2InvestmentTracker.App.Controllers;
using CS2InvestmentTracker.App.Hubs;
using CS2InvestmentTracker.Core.Exceptions;
using CS2InvestmentTracker.Core.Models;
using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Repositories.Custom;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Text.Json;

namespace CS2InvestmentTracker.App.Services;

public class PriceUpdateService(
    IServiceScopeFactory serviceScopeFactory,
    IHubContext<PriceUpdateHub> hubContext,
    ILogger<PriceUpdateService> logger)
{
    public async Task UpdateAllPricesAsync(IQueryable<Item> items, CancellationToken ct = default)
    {
        var total = items.Count();
        var processed = 0;

        foreach (var item in items)
        {
            ct.ThrowIfCancellationRequested();

            try
            {
                var provider = serviceScopeFactory.CreateScope().ServiceProvider;
                var steamApi = provider.GetRequiredService<SteamApi>();
                await steamApi.UpdateItemPriceAsync(item);
            }
            catch (HttpRequestException ex)
            {
                logger.LogError(ex, "Invalid HTTP request: {Message}", ex.Message);
            }
            catch (JsonException ex)
            {
                logger.LogError(ex, "Error deserializing JSON response: {Message}", ex.Message);
            }
            catch (ApiResponseException ex)
            {
                logger.LogError(ex, "Error reading API response: {Message}", ex.Message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating prices for item {ItemName}: {Message}",
                                item.Name, ex.Message);
            }

            processed++;

            // send progress update via SignalR
            await hubContext.Clients.All.SendAsync(
                "PriceUpdateProgress",
                new
                {
                    processed,
                    total
                },
                cancellationToken: ct
            );
        }

        // send completion message via SignalR
        await hubContext.Clients.All.SendAsync(
            "PriceUpdateCompleted",
            new { total },
            cancellationToken: ct
        );

        logger.LogInformation("Price update completed");
    }
}
