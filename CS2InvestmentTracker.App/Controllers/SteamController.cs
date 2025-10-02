using CS2InvestmentTracker.Core.Models;
using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Repositories.Custom;
using Microsoft.AspNetCore.Mvc;

namespace CS2InvestmentTracker.App.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SteamController(SteamApi steamApi, ItemRepository itemRepository, ILogger<SteamController> logger) : ControllerBase
{
    private readonly SteamApi steamApi = steamApi;
    private readonly ItemRepository itemRepository = itemRepository;
    private readonly ILogger<SteamController> logger = logger;

    [HttpPost]
    public async Task<ActionResult> UpdatePrices()
    {
        try
        {
            logger.LogInformation("Updating prices");
            var items = await itemRepository.GetAllAsync();
            await steamApi.UpdatePricesAsync(items.AsQueryable());
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while updating prices: {ex}", ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }

        return Ok();
    }

    [HttpPost("{itemId}")]
    public async Task<ActionResult<Item>> UpdatePrice(int itemId)
    {
        if (itemId <= 0)
        {
            logger.LogWarning("Error while updating price for item {name}: Invalid item ID", itemId);
            return BadRequest("Invalid item ID");
        }

        try
        {
            var item = await itemRepository.GetByIdAsync(itemId) ?? throw new Exception("Item not found");
            logger.LogInformation("Updating price for item {name}", item.Name);
            await steamApi.UpdateItemPriceAsync(item);
            return Ok(item);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while updating price for item {id}: {ex}", itemId, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
