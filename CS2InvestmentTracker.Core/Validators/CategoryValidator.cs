﻿using CS2InvestmentTracker.Core.Models.Database;
using FluentValidation;

namespace CS2InvestmentTracker.Core.Validators;

public class CategoryValidator : AbstractValidator<Category>
{
    public CategoryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
        RuleFor(x => x.Name).MaximumLength(50).WithMessage("Name must not exceed 50 characters.");
    }
}