﻿using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Exceptions;
using CS2InvestmentTracker.Core.Models.Database;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace CS2InvestmentTracker.Core.Models;

// API LIMIT: around 200 requests every 5 minutes for market items IIRC
public class SteamApi
{
    private const string PricesLink = "https://steamcommunity.com/market/priceoverview/?appid=730&currency=3&market_hash_name=";
    
    private readonly ApplicationDbContext context;
    private ILogger<SteamApi> logger;

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
                logger.LogError($"Richiesta HTTP non valida: {ex.Message}");
            }
            catch (JsonException ex)
            {
                logger.LogError($"Errore durante la deserializzazione della risposta JSON: {ex.Message}");
            }
            catch (ApiResponseException ex)
            {
                logger.LogError($"Errore durante la lettura della risposta API: {ex.Message}");
            }
            catch (Exception ex)
            {
                logger.LogError($"Errore durante l'aggiornamento dei prezzi per l'elemento {item.Name}: {ex.Message}");
            }
        }

        logger.LogInformation("Aggiornamento prezzi completato");
    }

    private async Task UpdateItemPriceAsync(Item item)
    {
        HttpClient web = new();

        var encodedItemName = Uri.EscapeDataString(item.Name);
        var apiUrl = PricesLink + encodedItemName;

        var response = await web.GetAsync(apiUrl);
        response.EnsureSuccessStatusCode();

        var responseBody = await response.Content.ReadAsStringAsync();
        var apiResponse = JsonSerializer.Deserialize<SteamApiResponse>(responseBody);

        if (apiResponse != null && apiResponse.Success)
        {
            item.MinSellPrice = apiResponse.LowestPrice;
            item.AvgSellPrice = apiResponse.MedianPrice;

            await context.SaveChangesAsync();
        }
        else
        {
            throw new ApiResponseException($"Risposta API non valida");
        }
    }
}
