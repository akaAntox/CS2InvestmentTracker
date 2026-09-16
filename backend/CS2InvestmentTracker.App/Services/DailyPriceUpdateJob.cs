using CS2InvestmentTracker.Core.Repositories.Custom;

namespace CS2InvestmentTracker.App.Services;

// Starts the price update once a day. Checking hourly for today's snapshot, instead of sleeping
// until a fixed time, also catches up after a restart and retries days where every item failed.
public class DailyPriceUpdateJob(
    IServiceScopeFactory serviceScopeFactory,
    PriceUpdateService priceUpdateService,
    ILogger<DailyPriceUpdateJob> logger) : BackgroundService
{
    private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(CheckInterval);
        do
        {
            try
            {
                using var scope = serviceScopeFactory.CreateScope();
                var itemRepository = scope.ServiceProvider.GetRequiredService<ItemRepository>();
                if (await itemRepository.HasSnapshotAsync(DateOnly.FromDateTime(DateTime.Now)))
                    continue;

                var items = await itemRepository.GetUnsoldItemsAsync();
                if (items.Count > 0 && priceUpdateService.TryStartUpdate(items))
                    logger.LogInformation("Daily price update started for {Count} items", items.Count);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Daily price update check failed: {Message}", ex.Message);
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
