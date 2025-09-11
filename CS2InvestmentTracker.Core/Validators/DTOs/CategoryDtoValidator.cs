using CS2InvestmentTracker.Core.Models.DTOs;
using FluentValidation;

namespace CS2InvestmentTracker.Core.Validators.DTOs;

public class CategoryCreateDtoValidator : AbstractValidator<CategoryCreateDto>
{
    public CategoryCreateDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
        RuleFor(x => x.Name).MaximumLength(50).WithMessage("Name must not exceed 50 characters.");
    }
}

public class CategoryUpdateDtoValidator : AbstractValidator<CategoryUpdateDto>
{
    public CategoryUpdateDtoValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0).WithMessage("Id must be greater than 0.");
        RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
        RuleFor(x => x.Name).MaximumLength(50).WithMessage("Name must not exceed 50 characters.");
    }
}

public class CategoryReadDtoValidator : AbstractValidator<CategoryReadDto>
{
    public CategoryReadDtoValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0).WithMessage("Id must be greater than 0.");
        RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
        RuleFor(x => x.Name).MaximumLength(50).WithMessage("Name must not exceed 50 characters.");
    }
}