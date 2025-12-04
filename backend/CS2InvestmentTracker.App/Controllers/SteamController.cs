using CS2InvestmentTracker.App.Services;
using CS2InvestmentTracker.Core.Exceptions;
using CS2InvestmentTracker.Core.Models;
using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Repositories.Custom;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace CS2InvestmentTracker.App.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SteamController(SteamApi steamApi, PriceUpdateService priceUpdateService, ItemRepository itemRepository, ILogger<SteamController> logger) : ControllerBase
{
    private readonly SteamApi steamApi = steamApi;
    private readonly PriceUpdateService priceUpdateService = priceUpdateService;
    private readonly ItemRepository itemRepository = itemRepository;
    private readonly ILogger<SteamController> logger = logger;

    [HttpPost]
    [SwaggerOperation(Summary = "Update prices for all items")]
    public async Task<ActionResult> UpdatePrices()
    {
        try
        {
            // Fetch all items and update their prices
            logger.LogInformation("Updating prices");
            var items = await itemRepository.GetAllAsync();
            await priceUpdateService.UpdateAllPricesAsync(items.AsQueryable());
        }
        catch (ItemNotFoundException ex)
        {
            logger.LogWarning(ex, "Item not found while updating prices: {Exception}", ex.Message);
            return NotFound("One or more items not found");
        }
        catch (ApiResponseException ex)
        {
            logger.LogWarning(ex, "API response error while updating prices: {Exception}", ex.Message);
            return StatusCode(StatusCodes.Status502BadGateway, "Error from external API");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error while updating prices: {Exception}", ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }

        return Ok();
    }

    [HttpPost("{itemId}")]
    [SwaggerOperation(Summary = "Update price for a specific item by ID")]
    public async Task<ActionResult<Item>> UpdatePrice(int itemId)
    {
        // Validate itemId
        if (itemId <= 0)
        {
            logger.LogWarning("Error while updating price for item {Name}: Invalid item ID", itemId);
            return BadRequest("Invalid item ID");
        }

        try
        {
            // Fetch the item by ID
            var item = await itemRepository.GetByIdAsync(itemId);
            if (item is null) return NotFound("Item not found");

            // Update the item's price
            logger.LogInformation("Updating price for item {Name}", item.Name);
            await steamApi.UpdateItemPriceAsync(item);
            return Ok(item);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error while updating price for item {Id}: {Exception}", itemId, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpGet("{itemId}/image-url")]
    [Produces("application/json")]
    [SwaggerOperation(Summary = "Get image URL for a specific item by ID")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetItemImageUrl(
        int itemId,
        CancellationToken ct = default)
    {
        if (itemId <= 0)
            return BadRequest("Invalid item ID");

        try
        {
            var item = await itemRepository.GetByIdAsync(itemId);
            if (item is null) return NotFound("Item not found");

            // 1) usa URL già salvato oppure chiedilo alla SteamApi
            var imageUrl = item.ImageUrl;
            if (string.IsNullOrWhiteSpace(imageUrl))
            {
                imageUrl = await steamApi.GetItemImageUrlAsync(item, ct);
                if (string.IsNullOrWhiteSpace(imageUrl))
                    return NotFound("Image not available");

                // persisti per evitare future chiamate
                item.ImageUrl = imageUrl;
                await itemRepository.UpdateAsync(item);
            }

            // 2) ritorna JSON con l'URL (nessun redirect)
            return Ok(new { url = imageUrl });
        }
        catch (ApiResponseException ex)
        {
            logger.LogWarning(ex, "Upstream API error while fetching image URL for item {Id}", itemId);
            return StatusCode(StatusCodes.Status502BadGateway, "Error from external API");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error while fetching image URL for item {Id}", itemId);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
