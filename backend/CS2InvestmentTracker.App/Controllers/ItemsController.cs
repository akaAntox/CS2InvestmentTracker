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
            var existingItem = await itemRepository.GetItemsByNameAsync(itemDto.Name);
            if (existingItem.Count != 0)
            {
                logger.LogWarning("Error while adding item {Name}: Item already exists", itemDto.Name);
                return Conflict("Item with the same name already exists.");
            }

            // Map DTO to entity
            var item = new Item
            {
                Name = itemDto.Name,
                Description = itemDto.Description,
                Quantity = itemDto.Quantity,
                BuyPrice = itemDto.BuyPrice,
                CategoryId = itemDto.CategoryId,
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
            await eventLogRepository.NewEvent(ActionType.Delete, $"Item id '{itemId}' deleted.");
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

    [HttpGet]
    [SwaggerOperation(Summary = "Get all items with their categories")]
    public async Task<ActionResult<IEnumerable<ItemReadDto>>> GetItems()
    {
        try
        {
            // Retrieve all items with their categories
            logger.LogInformation("Getting all items");
            var items = await itemRepository.GetItemsWithCategoryAsync();
            return Ok(items);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error while getting all items: {Exception}", ex.Message);
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
