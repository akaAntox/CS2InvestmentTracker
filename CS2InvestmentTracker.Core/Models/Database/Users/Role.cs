namespace CS2InvestmentTracker.Core.Models.Database.Users;

public enum Role
{
    Admin,
    PremiumUser,
    User
}

/// <summary>
/// User claim names
/// </summary>
public static class ClaimName
{
    public const string Role = "Role";

    public const string FirstName = "FirstName";

    public const string LastName = "LastName";
}
