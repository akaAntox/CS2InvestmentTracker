using CS2InvestmentTracker.Core.Exceptions;
using CS2InvestmentTracker.Core.Models;
using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Models.DTOs;
using CS2InvestmentTracker.Core.Repositories.Custom;
using CS2InvestmentTracker.Core.Validators.DTOs;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace CS2InvestmentTracker.App.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ItemsController(SteamApi steamApi, ILogger<ItemsController> logger, ItemRepository itemRepository, EventLogRepository eventLogRepository, UserManager<IdentityUser> userManager) : ControllerBase
{
    private readonly SteamApi steamApi = steamApi;

    [HttpPost]
    [SwaggerOperation(Summary = "Create a new item")]
    public async Task<ActionResult<Item>> CreateItem([FromBody] ItemCreateDto itemDto)
    {
        // Validate the incoming DTO
        var validator = new ItemCreateDtoValidator();
        var result = validator.Validate(itemDto);
        result.AddToModelState(ModelState);

        if (!ModelState.IsValid)
        {
            logger.LogWarning("Error while adding item {Name}: Invalid model state", itemDto.Name);
            return ValidationProblem(ModelState);
        }

        try
        {
            // Check for existing item with the same name
            var duplicateItems = await itemRepository.CheckDuplicates(itemDto.Name, itemDto.BuyPrice);
            if (duplicateItems)
            {
                logger.LogWarning("Error while adding item {Name}: Item already exists", itemDto.Name);
                return Conflict("Item with the same name and price already exists.");
            }

            // Map DTO to entity
            var item = new Item
            {
                Name = itemDto.Name,
                Description = itemDto.Description,
                Quantity = itemDto.Quantity,
                BuyPrice = itemDto.BuyPrice,
                CategoryId = itemDto.CategoryId,
                AlertAbovePrice = itemDto.AlertAbovePrice,
                AlertBelowPrice = itemDto.AlertBelowPrice,
                InsertDate = DateTime.Now
            };

            logger.LogInformation("Checking price for item {Name}", item.Name);
            await steamApi.UpdateItemPriceAsync(item, true);
            logger.LogInformation("Item {Name} created", item.Name);
            await eventLogRepository.NewEvent(ActionType.Insert, $"Item '{item.Name}' created.", item);

            return CreatedAtAction(nameof(GetItem), new { itemId = item.Id }, item);
        }
        catch (ItemNotFoundException ex)
        {
            logger.LogWarning(ex, "Item not found while updating prices: {Exception}", ex.Message);
            return StatusCode(StatusCodes.Status502BadGateway, $"Item does '{itemDto.Name}' not exist on Steam Market");
        }
        catch (ApiResponseException ex)
        {
            logger.LogWarning(ex, "API response error while updating prices: {Exception}", ex.Message);
            return StatusCode(StatusCodes.Status502BadGateway, $"Error from external API");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error while adding item {Name}: {Exception}", itemDto.Name, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpDelete("{itemId}")]
    [SwaggerOperation(Summary = "Delete an item by its ID")]
    public async Task<ActionResult> DeleteItem(int itemId)
    {
        // Validate the itemId
        if (itemId <= 0)
        {
            logger.LogWarning("Error while deleting item id {Id}: Invalid value", itemId);
            return BadRequest();
        }

        try
        {
            // Check if the item exists
            var existingItem = await itemRepository.GetByIdAsync(itemId);
            if (existingItem == null)
            {
                logger.LogWarning("Error while deleting item id {Id}: Item not found", itemId);
                return NotFound();
            }

            // Delete the item
            logger.LogInformation("Deleting item id {Id}", itemId);
            await itemRepository.DeleteAsync(i => i.Id == itemId);
            await eventLogRepository.NewEvent(ActionType.Delete, $"Item '{existingItem.Name}' deleted.");
            return Ok();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error while deleting item id {Id}: {Exception}", itemId, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpPut]
    [SwaggerOperation(Summary = "Update an existing item")]
    public async Task<ActionResult<Item>> UpdateItem([FromBody] ItemUpdateDto itemDto)
    {
        // Validate the incoming DTO
        var validator = new ItemUpdateDtoValidator();
        var result = validator.Validate(itemDto);
        result.AddToModelState(ModelState);

        if (!ModelState.IsValid)
        {
            logger.LogWarning("Error while updating item {Name}: Invalid model state", itemDto.Name);
            return ValidationProblem(ModelState);
        }

        try
        {
            // Check if the item exists
            var item = await itemRepository.GetByIdAsync(itemDto.Id);
            if (item == null)
            {
                logger.LogWarning("Error while updating item {Name}: Item not found", itemDto.Name);
                return NotFound();
            }

            // Update the item
            item.EditDate = DateTime.UtcNow;
            item.Name = itemDto.Name;
            item.Description = itemDto.Description;
            item.Quantity = itemDto.Quantity;
            item.BuyPrice = itemDto.BuyPrice;
            item.CategoryId = itemDto.CategoryId;
            item.AlertAbovePrice = itemDto.AlertAbovePrice;
            item.AlertBelowPrice = itemDto.AlertBelowPrice;
            item.SellPrice = itemDto.SellPrice;
            item.SellDate = itemDto.SellDate;

            logger.LogInformation("Updating item {Name}", item.Name);
            await itemRepository.UpdateAsync(item);
            await eventLogRepository.NewEvent(ActionType.Update, $"Item '{item.Name}' updated.", itemDto, item);
            return Ok(item);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error while updating item {Name}: {Exception}", itemDto.Name, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpPost("{itemId}/sell")]
    [SwaggerOperation(Summary = "Sell all or part of an item")]
    public async Task<ActionResult<Item>> SellItem(int itemId, [FromBody] ItemSellDto sellDto)
    {
        // Validate the itemId and the incoming DTO
        if (itemId <= 0)
        {
            logger.LogWarning("Error while selling item id {Id}: Invalid value", itemId);
            return BadRequest();
        }

        var validator = new ItemSellDtoValidator();
        var result = validator.Validate(sellDto);
        result.AddToModelState(ModelState);

        if (!ModelState.IsValid)
        {
            logger.LogWarning("Error while selling item id {Id}: Invalid model state", itemId);
            return ValidationProblem(ModelState);
        }

        try
        {
            var item = await itemRepository.GetByIdAsync(itemId);
            if (item == null)
            {
                logger.LogWarning("Error while selling item id {Id}: Item not found", itemId);
                return NotFound();
            }

            if (item.SellDate != null)
            {
                logger.LogWarning("Error while selling item {Name}: Item already sold", item.Name);
                return Conflict("Item already sold.");
            }

            if (sellDto.Quantity > item.Quantity)
            {
                logger.LogWarning("Error while selling item {Name}: Quantity {Quantity} exceeds owned {Owned}", item.Name, sellDto.Quantity, item.Quantity);
                return BadRequest($"Cannot sell more than the owned quantity ({item.Quantity}).");
            }

            logger.LogInformation("Selling {Quantity} of item {Name}", sellDto.Quantity, item.Name);
            var sold = await itemRepository.SellAsync(item, sellDto.Quantity, sellDto.SellPrice, sellDto.SellDate);
            await eventLogRepository.NewEvent(ActionType.Update, $"Item '{item.Name}' sold ({sellDto.Quantity}).", sellDto, sold);
            return Ok(sold);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error while selling item id {Id}: {Exception}", itemId, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpGet]
    [SwaggerOperation(Summary = "Get all items with their categories")]
    public async Task<ActionResult<IEnumerable<ItemReadDto>>> GetItems()
    {
        try
        {
            // Retrieve all items with their categories
            logger.LogInformation("Retrieving all items");
            var items = await itemRepository.GetItemsWithCategoryAsync();
            return Ok(items);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error while getting all items: {Exception}", ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpGet("history")]
    [SwaggerOperation(Summary = "Get the daily history of portfolio totals")]
    public async Task<ActionResult<IEnumerable<PortfolioHistoryDto>>> GetPortfolioHistory()
    {
        try
        {
            logger.LogInformation("Getting portfolio history");
            var history = await itemRepository.GetPortfolioHistoryAsync();
            return Ok(history);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error while getting portfolio history: {Exception}", ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpGet("{itemId}/history")]
    [SwaggerOperation(Summary = "Get the daily price history of an item")]
    public async Task<ActionResult<IEnumerable<PriceSnapshot>>> GetItemHistory(int itemId)
    {
        // Validate the itemId
        if (itemId <= 0)
        {
            logger.LogWarning("Error while getting history for item id {Id}: Invalid value", itemId);
            return BadRequest();
        }

        try
        {
            logger.LogInformation("Getting history for item id {Id}", itemId);
            var history = await itemRepository.GetItemHistoryAsync(itemId);
            return Ok(history);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error while getting history for item id {Id}: {Exception}", itemId, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpGet("{itemId}")]
    [SwaggerOperation(Summary = "Get an item by its ID")]
    public async Task<ActionResult<ItemReadDto>> GetItem(int itemId)
    {
        // Validate the itemId
        if (itemId <= 0)
        {
            logger.LogWarning("Error while getting item id {Id}: Invalid value", itemId);
            return BadRequest();
        }

        try
        {
            // Retrieve the item by id
            logger.LogInformation("Getting item id {Id}", itemId);
            var item = await itemRepository.GetByIdAsync(itemId) ?? throw new KeyNotFoundException("Item not found");
            return Ok(item);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error while getting item id {Id}: {Exception}", itemId, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
