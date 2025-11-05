using CS2InvestmentTracker.Core.Models.Database.Users;
using Microsoft.AspNetCore.Authorization;

namespace CS2InvestmentTracker.Core.Security.Policies;

/// <summary>
/// Requirement for admin users
/// </summary>
public class IsAdmin : IAuthorizationRequirement { }

public class IsAdminAuthorizationHandler : AuthorizationHandler<IsAdmin>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, IsAdmin requirement)
    {
        if (context.User.HasClaim(ClaimName.Role, $"{(int)Role.Admin}"))
            context.Succeed(requirement);

        return Task.FromResult(context);
    }
}
