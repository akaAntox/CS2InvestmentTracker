using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Exceptions;
using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Repositories.Custom;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace CS2InvestmentTracker.Core.Models;

// API LIMIT: around 200 requests every 5 minutes for market items IIRC
public class SteamApi(IServiceScopeFactory serviceScopeFactory,
                      IHttpClientFactory httpClientFactory,
                      ILogger<SteamApi> logger)
{
    private const string PricesLink = "https://steamcommunity.com/market/priceoverview/?appid=730&currency=3&market_hash_name=";
    private const string ListingBase = "https://steamcommunity.com/market/listings/730/";

    private readonly IServiceScopeFactory serviceScopeFactory = serviceScopeFactory;
    private readonly IHttpClientFactory httpClientFactory = httpClientFactory;
    private readonly ILogger<SteamApi> logger = logger;

    // Regex per meta og:image
    private static readonly Regex OgImageRegex = new(
        "<meta\\s+property=[\"']og:image[\"']\\s+content=[\"'](?<url>[^\"']+)[\"']",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    /// <summary>
    /// Aggiorna i prezzi per una collezione di item.
    /// </summary>
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

    /// <summary>
    /// Aggiorna il prezzo per un singolo item.
    /// </summary>
    public async Task UpdateItemPriceAsync(Item item, bool createItemInDb = false)
    {
        var http = httpClientFactory.CreateClient(nameof(SteamApi));

        var encodedItemName = Uri.EscapeDataString(item.Name);
        var apiUrl = PricesLink + encodedItemName;

        var response = await http.GetAsync(apiUrl);
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

    // =============== NUOVI METODI IMMAGINE ===============

    /// <summary>
    /// Restituisce l'URL dell'immagine dell'item leggendo la pagina listing (meta og:image).
    /// </summary>
    public async Task<string?> GetItemImageUrlAsync(Item item, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(item?.Name)) return null;

        var http = httpClientFactory.CreateClient(nameof(SteamApi));
        var listingUrl = ListingBase + Uri.EscapeDataString(item.Name);

        using var req = new HttpRequestMessage(HttpMethod.Get, listingUrl);
        req.Headers.Accept.ParseAdd("text/html");
        using var resp = await http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
        if (!resp.IsSuccessStatusCode) return null;

        var html = await resp.Content.ReadAsStringAsync(ct);
        var m = OgImageRegex.Match(html);
        if (!m.Success) return null;

        var url = m.Groups["url"].Value;
        // normalizza a https
        if (url.StartsWith("http://", StringComparison.OrdinalIgnoreCase))
            url = string.Concat("https://", url.AsSpan(7));

        return string.IsNullOrWhiteSpace(url) ? null : url;
    }

    /// <summary>
    /// Scarica i bytes dell'immagine (per proxy lato server).
    /// </summary>
    public async Task<(byte[] Data, string? ContentType, string? ETag)?> FetchImageAsync(string imageUrl, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(imageUrl)) return null;

        var http = httpClientFactory.CreateClient(nameof(SteamApi));
        using var req = new HttpRequestMessage(HttpMethod.Get, imageUrl);
        req.Headers.Accept.Clear();
        req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("image/*"));

        using var resp = await http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
        if (!resp.IsSuccessStatusCode) return null;

        var bytes = await resp.Content.ReadAsByteArrayAsync(ct);
        var contentType = resp.Content.Headers.ContentType?.ToString();
        var etag = resp.Headers.ETag?.Tag?.Trim('"');

        return (bytes, contentType, etag);
    }
}
