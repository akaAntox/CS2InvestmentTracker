using CS2InvestmentTracker.Core.Models.DTOs;
using FluentValidation;

namespace CS2InvestmentTracker.Core.Validators.DTOs;

public class ItemCreateDtoValidator : AbstractValidator<ItemCreateDto>
{
    public ItemCreateDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
        RuleFor(x => x.Name).MaximumLength(50).WithMessage("Name must not exceed 50 characters.");
        RuleFor(x => x.Description).MaximumLength(100).WithMessage("Description must not exceed 100 characters.");
        RuleFor(x => x.BuyPrice).GreaterThanOrEqualTo(0).WithMessage("BuyPrice must be greater than 0.");
        RuleFor(x => x.Quantity).GreaterThanOrEqualTo(0).WithMessage("Quantity must be greater than 0.");
        RuleFor(x => x.AlertAbovePrice).GreaterThan(0M).WithMessage("AlertAbovePrice must be greater than 0.");
        RuleFor(x => x.AlertBelowPrice).GreaterThan(0M).WithMessage("AlertBelowPrice must be greater than 0.");
    }
}

public class ItemUpdateDtoValidator : AbstractValidator<ItemUpdateDto>
{
    public ItemUpdateDtoValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0).WithMessage("Id must be greater than 0.");
        RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
        RuleFor(x => x.Name).MaximumLength(50).WithMessage("Name must not exceed 50 characters.");
        RuleFor(x => x.Description).MaximumLength(100).WithMessage("Description must not exceed 100 characters.");
        RuleFor(x => x.BuyPrice).GreaterThanOrEqualTo(0).WithMessage("BuyPrice must be greater than 0.");
        RuleFor(x => x.Quantity).GreaterThanOrEqualTo(0).WithMessage("Quantity must be greater than 0.");
        RuleFor(x => x.AlertAbovePrice).GreaterThan(0M).WithMessage("AlertAbovePrice must be greater than 0.");
        RuleFor(x => x.AlertBelowPrice).GreaterThan(0M).WithMessage("AlertBelowPrice must be greater than 0.");
        RuleFor(x => x.SellPrice).GreaterThanOrEqualTo(0M).WithMessage("SellPrice must be 0 or more.");
        RuleFor(x => x.SellDate).NotNull().When(x => x.SellPrice != null).WithMessage("SellDate is required when SellPrice is set.");
        RuleFor(x => x.SellPrice).NotNull().When(x => x.SellDate != null).WithMessage("SellPrice is required when SellDate is set.");
    }
}

public class ItemSellDtoValidator : AbstractValidator<ItemSellDto>
{
    public ItemSellDtoValidator()
    {
        RuleFor(x => x.Quantity).GreaterThan(0).WithMessage("Quantity must be greater than 0.");
        RuleFor(x => x.SellPrice).GreaterThanOrEqualTo(0).WithMessage("SellPrice must be 0 or more.");
        RuleFor(x => x.SellDate).NotEmpty().WithMessage("SellDate is required.");
    }
}

public class ItemReadDtoValidator : AbstractValidator<ItemReadDto>
{
    public ItemReadDtoValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0).WithMessage("Id must be greater than 0.");
        RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
        RuleFor(x => x.Name).MaximumLength(50).WithMessage("Name must not exceed 50 characters.");
        RuleFor(x => x.Description).MaximumLength(100).WithMessage("Description must not exceed 100 characters.");
        RuleFor(x => x.BuyPrice).GreaterThanOrEqualTo(0).WithMessage("BuyPrice must be greater than 0.");
        RuleFor(x => x.Quantity).GreaterThanOrEqualTo(0).WithMessage("Quantity must be greater than 0.");
        RuleFor(x => x.TotalBuyPrice).GreaterThanOrEqualTo(0).WithMessage("TotalBuyPrice must be greater than 0.");
        RuleFor(x => x.InsertDate).NotEmpty().WithMessage("InsertDate is required.");
    }
}