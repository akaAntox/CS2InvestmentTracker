using CS2InvestmentTracker.Core.Models;
using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Models.DTOs;
using CS2InvestmentTracker.Core.Repositories.Custom;
using CS2InvestmentTracker.Core.Validators.DTOs;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace CS2InvestmentTracker.App.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ItemsController(SteamApi steamApi, ILogger<ItemsController> logger, ItemRepository itemRepository, UserManager<IdentityUser> userManager) : ControllerBase
{
    private readonly SteamApi steamApi = steamApi;
    private readonly UserManager<IdentityUser> userManager = userManager;

    [HttpPost]
    public async Task<ActionResult<Item>> CreateItem([FromBody] ItemCreateDto itemDto)
    {
        var validator = new ItemCreateDtoValidator();
        var result = validator.Validate(itemDto);
        result.AddToModelState(ModelState);

        if (!ModelState.IsValid)
        {
            logger.LogWarning("Error while adding item {name}: Invalid model state", itemDto.Name);
            return ValidationProblem(ModelState);
        }

        try
        {
            var item = new Item
            {
                Name = itemDto.Name,
                Description = itemDto.Description,
                Quantity = itemDto.Quantity,
                BuyPrice = itemDto.BuyPrice,
                CategoryId = itemDto.CategoryId,
                InsertDate = DateTime.Now
            };

            logger.LogInformation("Adding item {name}", item.Name);
            await itemRepository.AddAsync(item);
            await steamApi.UpdateItemPriceAsync(item);
            return Ok(item);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while adding item {name}: {ex}", itemDto.Name, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpDelete("{itemId}")]
    public async Task<ActionResult> DeleteItem(int itemId)
    {
        if (itemId <= 0)
        {
            logger.LogWarning("Error while deleting item id {id}: Invalid value", itemId);
            return BadRequest();
        }

        try
        {
            logger.LogInformation("Deleting item id {id}", itemId);
            await itemRepository.DeleteAsync(i => i.Id == itemId);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while deleting item id {id}: {ex}", itemId, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }

        return Ok();
    }

    [HttpPut]
    public async Task<ActionResult<Item>> UpdateItem([FromBody] ItemUpdateDto itemDto)
    {
        var validator = new ItemUpdateDtoValidator();
        var result = validator.Validate(itemDto);
        result.AddToModelState(ModelState);

        if (!ModelState.IsValid)
        {
            logger.LogWarning("Error while updating item {name}: Invalid model state", itemDto.Name);
            return ValidationProblem(ModelState);
        }

        try
        {
            var item = await itemRepository.GetByIdAsync(itemDto.Id);
            if (item == null)
            {
                logger.LogWarning("Error while updating item {name}: Item not found", itemDto.Name);
                return NotFound();
            }

            item.EditDate = DateTime.UtcNow;
            item.Name = itemDto.Name;
            item.Description = itemDto.Description;
            item.Quantity = itemDto.Quantity;
            item.BuyPrice = itemDto.BuyPrice;
            item.CategoryId = itemDto.CategoryId;

            logger.LogInformation("Updating item {name}", item.Name);
            await itemRepository.UpdateAsync(item);
            return Ok(item);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while updating item {name}: {ex}", itemDto.Name, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ItemReadDto>>> GetItems()
    {
        try
        {
            logger.LogInformation("Getting all items");
            var items = await itemRepository.GetItemsWithCategoryAsync();
            return Ok(items);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while getting all items: {ex}", ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpGet("{itemId}")]
    public async Task<ActionResult<ItemReadDto>> GetItem(int itemId)
    {
        if (itemId <= 0)
        {
            logger.LogWarning("Error while getting item id {id}: Invalid value", itemId);
            return BadRequest();
        }

        try
        {
            logger.LogInformation("Getting item id {id}", itemId);
            var item = await itemRepository.GetByIdAsync(itemId) ?? throw new KeyNotFoundException("Item not found");

            return Ok(item);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while getting item id {id}: {ex}", itemId, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
