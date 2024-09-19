using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models;
using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Repositories.Custom;
using Microsoft.AspNetCore.Mvc;

namespace CS2InvestmentTracker.App.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SteamController : ControllerBase
{
    private readonly SteamApi steamApi;
    private readonly ItemRepository itemRepository;
    private readonly ILogger<SteamController> logger;

    public SteamController(SteamApi steamApi, ItemRepository itemRepository, ILogger<SteamController> logger)
    {
        this.steamApi = steamApi;
        this.itemRepository = itemRepository;
        this.logger = logger;
    }

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

    [HttpPost("{item}")]
    public async Task<ActionResult> UpdatePrice([FromBody] Item item)
    {
        if (item == null)
        {
            logger.LogWarning("Error while updating price: Invalid model state");
            return BadRequest();
        }

        try
        {
            logger.LogInformation("Updating price for item {name}", item.Name);
            var foundItem = await itemRepository.GetByIdAsync(item.Id);
            var items = new List<Item> { foundItem };
            await steamApi.UpdatePricesAsync(items.AsQueryable());
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while updating price for item {name}: {ex}", item.Name, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }

        return Ok();
    }
}
