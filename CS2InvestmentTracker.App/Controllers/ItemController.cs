using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Repositories.Custom;
using CS2InvestmentTracker.Core.Validators;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace CS2InvestmentTracker.App.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ItemController : ControllerBase
{
    private readonly ILogger<ItemController> logger;
    private readonly ItemRepository itemRepository;
    private readonly UserManager<IdentityUser> userManager;

    public ItemController(ILogger<ItemController> logger, ItemRepository itemRepository, UserManager<IdentityUser> userManager)
    {
        this.logger = logger;
        this.itemRepository = itemRepository;
        this.userManager = userManager;
    }

    [HttpPost]
    public async Task<ActionResult<Item>> InsertItem([FromBody] Item item)
    {
        var validator = new ItemValidator();
        var result = validator.Validate(item);
        result.AddToModelState(ModelState);

        if (!ModelState.IsValid)
        {
            logger.LogWarning("Error while adding item {name}: Invalid model state", item.Name);
            return BadRequest();
        }

        try
        {
            logger.LogInformation("Adding item {name}", item.Name);
            await itemRepository.AddAsync(item);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while adding item {name}: {ex}", item.Name, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }

        return Ok(item);
    }

    [HttpDelete]
    public async Task<ActionResult> DeleteItem([FromBody] int itemId)
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
    public async Task<ActionResult<Item>> UpdateItem([FromBody] Item item)
    {
        var validator = new ItemValidator();
        var result = validator.Validate(item);
        result.AddToModelState(ModelState);

        if (!ModelState.IsValid)
        {
            logger.LogWarning("Error while updating item {name}: Invalid model state", item.Name);
            return BadRequest();
        }

        try
        {
            logger.LogInformation("Updating item {name}", item.Name);
            await itemRepository.UpdateAsync(item);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while updating item {name}: {ex}", item.Name, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }

        return Ok(item);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Item>>> GetItems()
    {
        try
        {
            logger.LogInformation("Getting all items");
            var items = await itemRepository.GetAllAsync();
            return Ok(items);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while getting all items: {ex}", ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpGet("{itemId}")]
    public async Task<ActionResult<Item>> GetItem(int itemId)
    {
        if (itemId <= 0)
        {
            logger.LogWarning("Error while getting item id {id}: Invalid value", itemId);
            return BadRequest();
        }

        try
        {
            logger.LogInformation("Getting item id {id}", itemId);
            var item = await itemRepository.GetByIdAsync(itemId);
            return Ok(item);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while getting item id {id}: {ex}", itemId, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
