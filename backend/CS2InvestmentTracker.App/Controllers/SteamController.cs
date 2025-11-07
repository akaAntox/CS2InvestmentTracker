using CS2InvestmentTracker.Core.Models;
using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Repositories.Custom;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace CS2InvestmentTracker.App.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SteamController(SteamApi steamApi, ItemRepository itemRepository, ILogger<SteamController> logger) : ControllerBase
{
    private readonly SteamApi steamApi = steamApi;
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
            await steamApi.UpdatePricesAsync(items.AsQueryable());
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
}
