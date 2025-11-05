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
        // Validate the incoming DTO
        var validator = new CategoryCreateDtoValidator();
        var result = validator.Validate(categoryDto);
        result.AddToModelState(ModelState);

        if (!ModelState.IsValid)
        {
            logger.LogWarning("Error while adding category {Name}: Invalid model state", categoryDto.Name);
            return ValidationProblem(ModelState);
        }

        try
        {
            // Check for existing category with the same name
            var existingCategory = await categoryRepository.GetCategoriesByNameAsync(categoryDto.Name);
            if (existingCategory.Count != 0)
            {
                logger.LogWarning("Error while adding category {Name}: Category already exists", categoryDto.Name);
                return Conflict("Category with the same name already exists.");
            }

            // Map DTO to entity
            var category = new Category
            {
                Name = categoryDto.Name,
                Description = categoryDto.Description
            };

            // Save to database
            logger.LogInformation("Adding category {Name}", category.Name);
            await categoryRepository.AddAsync(category);
            await eventRepository.NewEvent(ActionType.Insert, $"Category '{category.Name}' created.", category);
            return Ok(category);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error while adding category {Name}: {Exception}", categoryDto.Name, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpDelete("{categoryId}")]
    public async Task<ActionResult> DeleteCategory(int categoryId)
    {
        // Validate categoryId
        if (categoryId <= 0)
        {
            logger.LogWarning("Error while deleting category id {Id}: Invalid value", categoryId);
            return BadRequest();
        }

        try
        {
            // Check if category exists
            var category = await categoryRepository.GetByIdAsync(categoryId);
            if (category == null)
            {
                logger.LogWarning("Error while deleting category id {Id}: Category not found", categoryId);
                return NotFound();
            }

            // Delete category
            logger.LogInformation("Deleting category id {Id}", categoryId);
            await categoryRepository.DeleteAsync(c => c.Id == categoryId);
            await eventRepository.NewEvent(ActionType.Delete, $"Category id {categoryId} deleted.");
            return Ok();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error while deleting category id {Id}: {Exception}", categoryId, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpPut]
    public async Task<ActionResult<Category>> UpdateCategory([FromBody] CategoryUpdateDto categoryDto)
    {
        // Validate the incoming DTO
        var validator = new CategoryUpdateDtoValidator();
        var result = validator.Validate(categoryDto);
        result.AddToModelState(ModelState);

        if (!ModelState.IsValid)
        {
            logger.LogWarning("Error while updating category {Name}: Invalid model state", categoryDto.Name);
            return ValidationProblem(ModelState);
        }

        try
        {
            // Check if category exists
            var category = await categoryRepository.GetByIdAsync(categoryDto.Id);
            if (category == null)
            {
                logger.LogWarning("Error while updating category {Name}: Category not found", categoryDto.Name);
                return NotFound();
            }

            // Update category properties
            category.Name = categoryDto.Name;
            category.Description = categoryDto.Description;

            logger.LogInformation("Updating category {Name}", category.Name);
            await categoryRepository.UpdateAsync(category);
            await eventRepository.NewEvent(ActionType.Update, $"Category {category.Name} updated.", categoryDto, category);
            return Ok(category);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error while updating category {Name}: {Exception}", categoryDto.Name, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryReadDto>>> GetCategories()
    {
        try
        {
            // Retrieve all categories
            logger.LogInformation("Getting all categories");
            var categories = await categoryRepository.GetAllAsync();
            return Ok(categories);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error while getting all categories: {Exception}", ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpGet("{categoryId}")]
    public async Task<ActionResult<CategoryReadDto>> GetCategory(int categoryId)
    {
        // Validate categoryId
        if (categoryId <= 0)
        {
            logger.LogWarning("Error while getting category id {Id}: Invalid value", categoryId);
            return BadRequest();
        }

        try
        {
            // Retrieve category by id
            logger.LogInformation("Getting category id {Id}", categoryId);
            var category = await categoryRepository.GetByIdAsync(categoryId) ?? throw new KeyNotFoundException("Category not found");
            return Ok(category);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error while getting category id {Id}: {Exception}", categoryId, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
