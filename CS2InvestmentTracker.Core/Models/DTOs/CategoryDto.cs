using CS2InvestmentTracker.Core.Models.Database;

namespace CS2InvestmentTracker.Core.Models.DTOs;

public class CategoryDto
{
    public string Name { get; set; }
    public string Description { get; set; }
}

public class CategoryCreateDto : CategoryDto { }

public class CategoryUpdateDto : Category { }

public class CategoryReadDto : Category { }