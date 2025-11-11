using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Repositories.Custom;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace CS2InvestmentTracker.App.Pages;

public class IndexModel : PageModel
{
    public IActionResult OnGetItemsAsync() => Partial("_ItemsTable");
    public IActionResult OnGetCategoriesAsync() => Partial("_CategoriesTable");
}
