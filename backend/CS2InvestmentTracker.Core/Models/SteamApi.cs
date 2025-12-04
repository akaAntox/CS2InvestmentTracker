using CS2InvestmentTracker.Core.Exceptions;
using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Repositories.Custom;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace CS2InvestmentTracker.Core.Models;

public class SteamApi(IServiceScopeFactory serviceScopeFactory,
                      IHttpClientFactory httpClientFactory,
                      ILogger<SteamApi> logger)
{
    private const string PricesLink = "https://steamcommunity.com/market/priceoverview/?appid=730&currency=3&market_hash_name=";
    private const string ListingBase = "https://steamcommunity.com/market/listings/730/";

    private readonly IServiceScopeFactory serviceScopeFactory = serviceScopeFactory;
    private readonly IHttpClientFactory httpClientFactory = httpClientFactory;
    private readonly ILogger<SteamApi> logger = logger;

    // === RATE LIMITING ===
    // Valore conservativo: ~ 1 richiesta / secondo
    // Puoi abbassare o alzare questo valore se vedi che è troppo lento o ancora dà 429
    private static readonly TimeSpan MinDelayBetweenRequests = TimeSpan.FromMilliseconds(3000);

    private readonly SemaphoreSlim rateLimiter = new(1, 1);
    private DateTime lastRequestUtc = DateTime.MinValue;

    // Regex per meta og:image
    private static readonly Regex OgImageRegex = new(
        "<meta\\s+property=[\"']og:image[\"']\\s+content=[\"'](?<url>[^\"']+)[\"']",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private async Task WaitForRateLimitSlotAsync(CancellationToken ct)
    {
        await rateLimiter.WaitAsync(ct);
        try
        {
            var now = DateTime.UtcNow;
            var nextAllowed = lastRequestUtc + MinDelayBetweenRequests;

            if (nextAllowed > now)
            {
                var delay = nextAllowed - now;
                await Task.Delay(delay, ct);
            }

            lastRequestUtc = DateTime.UtcNow;
        }
        finally
        {
            rateLimiter.Release();
        }
    }

    /// <summary>
    /// Aggiorna il prezzo per un singolo item.
    /// </summary>
    public async Task UpdateItemPriceAsync(Item item, bool createItemInDb = false, CancellationToken ct = default)
    {
        logger.LogInformation("Updating price for item {Name}", item.Name);
        await WaitForRateLimitSlotAsync(CancellationToken.None);
        using var http = httpClientFactory.CreateClient(nameof(SteamApi));

        var encodedItemName = Uri.EscapeDataString(item.Name);
        var apiUrl = PricesLink + encodedItemName;

        // Applica il rate limit PRIMA di fare la chiamata HTTP
        await WaitForRateLimitSlotAsync(ct);

        HttpResponseMessage response = await http.GetAsync(apiUrl, ct);

        // Gestione esplicita del 429
        if (response.StatusCode == (HttpStatusCode)429)
        {
            var retryAfter = response.Headers.RetryAfter?.Delta ?? TimeSpan.FromSeconds(5);
            logger.LogWarning("Steam returned 429 TooManyRequests for {ItemName}. Backing off for {RetryAfter} seconds",
                item.Name, retryAfter.TotalSeconds);

            await Task.Delay(retryAfter, ct);

            // Riapplichiamo anche il nostro rate limit
            await WaitForRateLimitSlotAsync(ct);
            response = await http.GetAsync(apiUrl, ct);
        }

        response.EnsureSuccessStatusCode();

        var responseBody = await response.Content.ReadAsStringAsync(ct);
        var apiResponse = JsonSerializer.Deserialize<SteamApiResponse>(responseBody);

        if (apiResponse == null || !apiResponse.Success)
            throw new ApiResponseException($"Invalid API response");
        if (apiResponse.LowestPrice == 0 && apiResponse.MedianPrice == 0 && apiResponse.Volume == 0)
            throw new ItemNotFoundException($"No price data available for item '{item.Name}'");

        item.MinSellPrice = apiResponse.LowestPrice;
        item.AvgSellPrice = apiResponse.MedianPrice;
        item.SellVolume = apiResponse.Volume;

        var provider = serviceScopeFactory.CreateScope().ServiceProvider;
        var itemRepository = provider.GetRequiredService<ItemRepository>();
        await (createItemInDb ? itemRepository.AddAsync(item) : itemRepository.UpdateAsync(item));
    }

    /// <summary>
    /// Restituisce l'URL dell'immagine dell'item leggendo la pagina listing (meta og:image).
    /// </summary>
    public async Task<string?> GetItemImageUrlAsync(Item item, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(item?.Name)) return null;

        var http = httpClientFactory.CreateClient(nameof(SteamApi));
        var listingUrl = ListingBase + Uri.EscapeDataString(item.Name);

        // Applichiamo anche qui il rate limit per sicurezza
        await WaitForRateLimitSlotAsync(ct);

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
}
