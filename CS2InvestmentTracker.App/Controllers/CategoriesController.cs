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
public class CategoriesController(ILogger<CategoriesController> logger, CategoryRepository categoryRepository, EventLogRepository eventRepository, UserManager<IdentityUser> userManager) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<Category>> CreateCategory([FromBody] CategoryCreateDto categoryDto)
    {
        var validator = new CategoryCreateDtoValidator();
        var result = validator.Validate(categoryDto);
        result.AddToModelState(ModelState);

        if (!ModelState.IsValid)
        {
            logger.LogWarning("Error while adding category {name}: Invalid model state", categoryDto.Name);
            return ValidationProblem(ModelState);
        }

        try
        {
            var category = new Category
            {
                Name = categoryDto.Name,
                Description = categoryDto.Description
            };

            logger.LogInformation("Adding category {name}", category.Name);
            await categoryRepository.AddAsync(category);
            await eventRepository.NewEvent(ActionType.Insert, $"Category '{category.Name}' created.", category);
            return Ok(category);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while adding category {name}: {ex}", categoryDto.Name, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpDelete("{categoryId}")]
    public async Task<ActionResult> DeleteCategory(int categoryId)
    {
        if (categoryId <= 0)
        {
            logger.LogWarning("Error while deleting category id {id}: Invalid value", categoryId);
            return BadRequest();
        }

        try
        {
            logger.LogInformation("Deleting category id {id}", categoryId);
            await categoryRepository.DeleteAsync(c => c.Id == categoryId);
            await eventRepository.NewEvent(ActionType.Delete, $"Category id {categoryId} deleted.");
            return Ok();
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while deleting category id {id}: {ex}", categoryId, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpPut]
    public async Task<ActionResult<Category>> UpdateCategory([FromBody] CategoryUpdateDto categoryDto)
    {
        var validator = new CategoryUpdateDtoValidator();
        var result = validator.Validate(categoryDto);
        result.AddToModelState(ModelState);

        if (!ModelState.IsValid)
        {
            logger.LogWarning("Error while updating category {name}: Invalid model state", categoryDto.Name);
            return ValidationProblem(ModelState);
        }

        try
        {
            var category = await categoryRepository.GetByIdAsync(categoryDto.Id);
            if (category == null)
            {
                logger.LogWarning("Error while updating category {name}: Category not found", categoryDto.Name);
                return NotFound();
            }

            category.Name = categoryDto.Name;
            category.Description = categoryDto.Description;

            logger.LogInformation("Updating category {name}", category.Name);
            await categoryRepository.UpdateAsync(category);
            await eventRepository.NewEvent(ActionType.Update, $"Category {category.Name} updated.", categoryDto, category);
            return Ok(category);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while updating category {name}: {ex}", categoryDto.Name, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryReadDto>>> GetCategories()
    {
        try
        {
            logger.LogInformation("Getting all categories");
            var categories = await categoryRepository.GetAllAsync();
            return Ok(categories);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while getting all categories: {ex}", ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpGet("{categoryId}")]
    public async Task<ActionResult<CategoryReadDto>> GetCategory(int categoryId)
    {
        if (categoryId <= 0)
        {
            logger.LogWarning("Error while getting category id {id}: Invalid value", categoryId);
            return BadRequest();
        }

        try
        {
            logger.LogInformation("Getting category id {id}", categoryId);
            var category = await categoryRepository.GetByIdAsync(categoryId) ?? throw new KeyNotFoundException("Category not found");

            return Ok(category);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while getting category id {id}: {ex}", categoryId, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
