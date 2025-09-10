using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Models.DTOs;
using CS2InvestmentTracker.Core.Repositories.Custom;
using CS2InvestmentTracker.Core.Validators;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Mvc;

namespace CS2InvestmentTracker.App.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CategoriesController : ControllerBase
{
    private ILogger<CategoriesController> logger;
    private CategoryRepository categoryRepository;

    public CategoriesController(ILogger<CategoriesController> logger, CategoryRepository categoryRepository)
    {
        this.logger = logger;
        this.categoryRepository = categoryRepository;
    }

    [HttpPost]
    public async Task<ActionResult<CategoryCreateDto>> CreateCategory([FromBody] CategoryCreateDto categoryDto)
    {
        var validator = new CategoryCreateDtoValidator();
        var result = validator.Validate(categoryDto);
        result.AddToModelState(ModelState);

        if (!ModelState.IsValid)
        {
            logger.LogWarning("Error while adding category {name}: Invalid model state", categoryDto.Name);
            return BadRequest();
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
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while adding category {name}: {ex}", categoryDto.Name, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }

        return Ok(categoryDto);
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
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while deleting category id {id}: {ex}", categoryId, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }

        return Ok();
    }

    [HttpPut]
    public async Task<ActionResult<Category>> UpdateCategory([FromBody] CategoryUpdateDto category)
    {
        var validator = new CategoryValidator();
        var result = validator.Validate(category);
        result.AddToModelState(ModelState);

        if (!ModelState.IsValid)
        {
            logger.LogWarning("Error while updating category {name}: Invalid model state", category.Name);
            return BadRequest();
        }

        try
        {
            logger.LogInformation("Updating category {name}", category.Name);
            await categoryRepository.UpdateAsync(category);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while updating category {name}: {ex}", category.Name, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }

        return Ok(category);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
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
    public async Task<ActionResult<Category>> GetCategory(int categoryId)
    {
        if (categoryId <= 0)
        {
            logger.LogWarning("Error while getting category id {id}: Invalid value", categoryId);
            return BadRequest();
        }

        try
        {
            logger.LogInformation("Getting category id {id}", categoryId);
            var category = await categoryRepository.GetByIdAsync(categoryId);
            return Ok(category);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Error while getting category id {id}: {ex}", categoryId, ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
