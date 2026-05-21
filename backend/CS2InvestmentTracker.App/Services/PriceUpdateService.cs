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
    private readonly object _lock = new();
    private bool _isUpdating = false;
    private int _processedCount = 0;
    private int _totalCount = 0;

    public (bool IsUpdating, int Processed, int Total) GetCurrentStatus()
    {
        lock (_lock)
        {
            return (_isUpdating, _processedCount, _totalCount);
        }
    }

    public bool TryStartUpdate(List<Item> itemsToUpdate)
    {
        lock (_lock)
        {
            if (_isUpdating) return false; // already updating
            _isUpdating = true;
            _processedCount = 0;
            _totalCount = itemsToUpdate.Count;
        }

        // fire and forget
        _ = Task.Run(async () => {
            try { await ProcessUpdatesAsync(itemsToUpdate); }
            catch (Exception ex) { logger.LogError(ex, "Unexpected error during price update: {Message}", ex.Message); }
            finally { lock (_lock) { _isUpdating = false; } }
        });

        return true;
    }

    private async Task ProcessUpdatesAsync(List<Item> items, CancellationToken ct = default)
    {
        logger.LogInformation("Starting background price update...");

        foreach (var item in items)
        {
            ct.ThrowIfCancellationRequested();
            try
            {
                using var scope = serviceScopeFactory.CreateScope();
                var steamApi = scope.ServiceProvider.GetRequiredService<SteamApi>();
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
            catch (ItemNotFoundException ex)
            {
                logger.LogWarning("No price data available for item {ItemName}: {Message}",
                                  item.Name, ex.Message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating prices for item {ItemName}: {Message}",
                                item.Name, ex.Message);
            }

            lock (_lock) { _processedCount++; }
            // send progress update via SignalR
            await hubContext.Clients.All.SendAsync("PriceUpdateProgress",
                new
                {
                    processed = _processedCount,
                    total = _totalCount
                },
                cancellationToken: ct
            );
        }
        // send completion message via SignalR
        await hubContext.Clients.All.SendAsync("PriceUpdateCompleted",
            new { total = _totalCount },
            cancellationToken: ct
        );
        logger.LogInformation("Price update completed");
    }
}
