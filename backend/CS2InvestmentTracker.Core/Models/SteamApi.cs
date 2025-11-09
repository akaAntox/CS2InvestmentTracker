using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Exceptions;
using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Repositories.Custom;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace CS2InvestmentTracker.Core.Models;

// API LIMIT: around 200 requests every 5 minutes for market items IIRC
public class SteamApi(IServiceScopeFactory serviceScopeFactory, ILogger<SteamApi> logger)
{
    private const string PricesLink = "https://steamcommunity.com/market/priceoverview/?appid=730&currency=3&market_hash_name=";
    
    public async Task UpdatePricesAsync(IQueryable<Item> items)
    {
        foreach (Item item in items)
        {
            try
            {
                await UpdateItemPriceAsync(item);
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
        }

        logger.LogInformation("Price update completed");
    }

    public async Task UpdateItemPriceAsync(Item item, bool createItemInDb = false)
    {
        HttpClient web = new();

        var encodedItemName = Uri.EscapeDataString(item.Name);
        var apiUrl = PricesLink + encodedItemName;

        var response = await web.GetAsync(apiUrl);
        response.EnsureSuccessStatusCode();

        var responseBody = await response.Content.ReadAsStringAsync();
        var apiResponse = JsonSerializer.Deserialize<SteamApiResponse>(responseBody);

        if (apiResponse == null || !apiResponse.Success) throw new ApiResponseException($"Invalid API response");
        if (apiResponse.LowestPrice == 0 && apiResponse.MedianPrice == 0 && apiResponse.Volume == 0)
            throw new ItemNotFoundException($"No price data available for item '{item.Name}'");

        item.MinSellPrice = apiResponse.LowestPrice;
        item.AvgSellPrice = apiResponse.MedianPrice;
        item.SellVolume = apiResponse.Volume;

        var provider = serviceScopeFactory.CreateScope().ServiceProvider;
        var itemRepository = provider.GetRequiredService<ItemRepository>();
        await (createItemInDb ? itemRepository.AddAsync(item) : itemRepository.UpdateAsync(item));
    }
}
