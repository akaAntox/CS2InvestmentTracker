using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models.Database;
using System.Text.Json;

namespace CS2InvestmentTracker.Core.Models;

public class SteamApi
{
    private const string PricesLink = "https://steamcommunity.com/market/priceoverview/?appid=730&currency=3&market_hash_name=";

    public static async Task UpdatePricesAsync(ApplicationDbContext context, IQueryable<Item> items)
    {
        HttpClient web = new();

        foreach (Item item in items)
        {
            try
            {
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
                    Console.WriteLine($"Errore: Risposta API non valida per l'elemento {item.Name}");
                }
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"Richiesta HTTP non valida: {ex.Message}");
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"Errore durante la deserializzazione della risposta JSON: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Errore durante l'aggiornamento dei prezzi per l'elemento {item.Name}: {ex.Message}");
            }
        }

        Console.WriteLine("Aggiornamento prezzi completato");
    }
}
