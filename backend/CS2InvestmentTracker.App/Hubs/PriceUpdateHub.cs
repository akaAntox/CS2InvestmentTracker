using CS2InvestmentTracker.App.Services;
using Microsoft.AspNetCore.SignalR;

namespace CS2InvestmentTracker.App.Hubs;

public class PriceUpdateHub(PriceUpdateService priceService) : Hub
{
    public async Task GetCurrentStatus()
    {
        var status = priceService.GetCurrentStatus();

        // Rispondi solo al chiamante con lo stato attuale
        await Clients.Caller.SendAsync("UpdateStatus", new
        {
            isUpdating = status.IsUpdating,
            processed = status.Processed,
            total = status.Total
        });
    }
}
