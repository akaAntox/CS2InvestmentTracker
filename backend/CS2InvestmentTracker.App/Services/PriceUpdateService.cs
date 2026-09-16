using CS2InvestmentTracker.App.Hubs;
using CS2InvestmentTracker.Core.Exceptions;
using CS2InvestmentTracker.Core.Models;
using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Repositories.Custom;
using Microsoft.AspNetCore.SignalR;

namespace CS2InvestmentTracker.App.Services;

public class PriceUpdateService(
    IServiceScopeFactory serviceScopeFactory,
    IHubContext<PriceUpdateHub> hubContext,
    PriceAlertService priceAlertService,
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
        _ = Task.Run(async () =>
        {
            try { await ProcessUpdatesAsync(itemsToUpdate); }
            catch (Exception ex) { logger.LogError(ex, "Unexpected error during price update: {Message}", ex.Message); }
            finally { lock (_lock) { _isUpdating = false; } }
        });

        return true;
    }

    // ponytail: fixed passes and cooldown; switch to adaptive backoff if Steam blocks last longer
    private const int MaxPasses = 3;
    private static readonly TimeSpan RetryCooldown = TimeSpan.FromMinutes(2);

    private async Task ProcessUpdatesAsync(List<Item> items, CancellationToken ct = default)
    {
        logger.LogInformation("Starting background price update...");

        // Items with the same name share the market price: one request per name
        var pending = items.GroupBy(i => i.Name).ToList();
        var failedNames = new List<string>();
        var failedCount = 0;

        for (var pass = 1; pass <= MaxPasses && pending.Count > 0; pass++)
        {
            if (pass > 1)
            {
                logger.LogWarning("Retrying {Count} failed items in {Cooldown} (pass {Pass}/{MaxPasses})",
                                  pending.Count, RetryCooldown, pass, MaxPasses);
                await Task.Delay(RetryCooldown, ct);
            }

            var retry = new List<IGrouping<string, Item>>();
            foreach (var group in pending)
            {
                ct.ThrowIfCancellationRequested();
                var error = await TryUpdateAsync(group.First());

                // Transient errors (429, timeouts, 5xx, network) are retried in the next pass
                if (error is not null && error is not ItemNotFoundException && pass < MaxPasses)
                {
                    retry.Add(group);
                    continue;
                }

                if (error is not null)
                {
                    failedNames.Add(group.Key);
                    failedCount += group.Count();
                }

                lock (_lock) { _processedCount += group.Count(); }
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
            pending = retry;
        }

        // No history or alerts when nothing got updated, so the daily job tries again later
        if (failedCount < _totalCount)
        {
            await SaveSnapshotAsync();
            await priceAlertService.CheckAsync();
        }

        // send completion message via SignalR
        await hubContext.Clients.All.SendAsync("PriceUpdateCompleted",
            new { total = _totalCount, failed = failedCount },
            cancellationToken: ct
        );

        if (failedCount > 0)
            logger.LogWarning("Price update completed, {Failed} items not updated: {Names}",
                              failedCount, string.Join(", ", failedNames));
        else
            logger.LogInformation("Price update completed");
    }

    private async Task SaveSnapshotAsync()
    {
        try
        {
            using var scope = serviceScopeFactory.CreateScope();
            var itemRepository = scope.ServiceProvider.GetRequiredService<ItemRepository>();
            await itemRepository.SaveSnapshotAsync(DateOnly.FromDateTime(DateTime.Now));
        }
        catch (Exception ex)
        {
            // A failed history write must not block the completion message
            logger.LogError(ex, "Error saving price snapshot: {Message}", ex.Message);
        }
    }

    // Returns null on success, otherwise the error that stopped the update
    private async Task<Exception?> TryUpdateAsync(Item item)
    {
        try
        {
            using var scope = serviceScopeFactory.CreateScope();
            var steamApi = scope.ServiceProvider.GetRequiredService<SteamApi>();
            await steamApi.UpdateItemPriceAsync(item);
            return null;
        }
        catch (ItemNotFoundException ex)
        {
            logger.LogWarning("No price data available for item {ItemName}: {Message}", item.Name, ex.Message);
            return ex;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating prices for item {ItemName}: {Message}", item.Name, ex.Message);
            return ex;
        }
    }
}
