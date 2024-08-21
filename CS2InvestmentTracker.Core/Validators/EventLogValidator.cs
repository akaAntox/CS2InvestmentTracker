using CS2InvestmentTracker.Core.Models.Database;
using FluentValidation;

namespace CS2InvestmentTracker.Core.Validators;

public class EventLogValidator : AbstractValidator<EventLog>
{
    public EventLogValidator()
    {
        RuleFor(x => x.Date).NotEmpty().WithMessage("Date is required");
        RuleFor(x => x.Action).NotEmpty().WithMessage("Action is required");
        RuleFor(x => x.Action).IsInEnum().WithMessage("Action must be a valid ActionType");
        RuleFor(x => x.Message).NotEmpty().WithMessage("Message is required");
    }
}