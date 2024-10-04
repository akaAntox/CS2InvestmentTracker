using CS2InvestmentTracker.Core.Repositories.Custom;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc;

namespace CS2InvestmentTracker.App.Pages;

public class IndexModel : PageModel
{
    private readonly ItemRepository _itemRepository;
    private readonly CategoryRepository _categoryRepository;

    public IndexModel(ItemRepository itemRepository, CategoryRepository categoryRepository)
    {
        _itemRepository = itemRepository;
        _categoryRepository = categoryRepository;
    }

    public async Task<IActionResult> OnGetItemsAsync()
    {
        var items = await _itemRepository.GetAllAsync();
        return Partial("_ItemsTable", items);
    }

    public async Task<IActionResult> OnGetCategoriesAsync()
    {
        var categories = await _categoryRepository.GetAllAsync();
        return Partial("_CategoriesTable", categories);
    }
}
