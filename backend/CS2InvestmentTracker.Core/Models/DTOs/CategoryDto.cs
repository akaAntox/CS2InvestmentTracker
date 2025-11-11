namespace CS2InvestmentTracker.Core.Models.DTOs;

public class CategoryDto
{
    public required string Name { get; set; }
    public required string Description { get; set; }
}

public class CategoryCreateDto : CategoryDto { }

public class CategoryUpdateDto : CategoryDto
{
    public int Id { get; set; }
}

public class CategoryReadDto : CategoryDto
{
    public int Id { get; set; }
}