using CS2InvestmentTracker.Core.Models.Database;
using FluentValidation;

namespace CS2InvestmentTracker.Core.Validators;

public class ItemValidator : AbstractValidator<Item>
{
    public ItemValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
        RuleFor(x => x.Name).MaximumLength(50).WithMessage("Name must not exceed 50 characters.");
        RuleFor(x => x.Description).MaximumLength(100).WithMessage("Description must not exceed 100 characters.");
        RuleFor(x => x.BuyPrice).GreaterThan(0).WithMessage("BuyPrice must be greater than 0.");
        RuleFor(x => x.TotalBuyPrice).GreaterThan(0).WithMessage("BuyPrice must be greater than 0.");
        RuleFor(x => x.Quantity).GreaterThan(0).WithMessage("Quantity must be greater than 0.");
        RuleFor(x => x.InsertDate).NotEmpty().WithMessage("InsertDate is required.");
    }
}