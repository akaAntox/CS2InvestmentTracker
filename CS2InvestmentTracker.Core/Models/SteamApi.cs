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
                logger.LogError(ex, "Richiesta HTTP non valida: {Message}", ex.Message);
            }
            catch (JsonException ex)
            {
                logger.LogError(ex, "Errore durante la deserializzazione della risposta JSON: {Message}", ex.Message);
            }
            catch (ApiResponseException ex)
            {
                logger.LogError(ex, "Errore durante la lettura della risposta API: {Message}", ex.Message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Errore durante l'aggiornamento dei prezzi per l'elemento {ItemName}: {Message}",
                                item.Name, ex.Message);
            }
        }

        logger.LogInformation("Aggiornamento prezzi completato");
    }

    public async Task UpdateItemPriceAsync(Item item)
    {
        HttpClient web = new();

        var encodedItemName = Uri.EscapeDataString(item.Name);
        var apiUrl = PricesLink + encodedItemName;

        var response = await web.GetAsync(apiUrl);
        response.EnsureSuccessStatusCode();

        var responseBody = await response.Content.ReadAsStringAsync();
        var apiResponse = JsonSerializer.Deserialize<SteamApiResponse>(responseBody);

        if (apiResponse == null || !apiResponse.Success) throw new ApiResponseException($"Risposta API non valida");

        item.MinSellPrice = apiResponse.LowestPrice;
        item.AvgSellPrice = apiResponse.MedianPrice;
        item.SellVolume = apiResponse.Volume;

        var provider = serviceScopeFactory.CreateScope().ServiceProvider;
        var itemRepository = provider.GetRequiredService<ItemRepository>();
        await itemRepository.UpdateAsync(item);
    }
}
