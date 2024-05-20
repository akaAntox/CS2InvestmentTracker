using CS2InvestmentTracker.Core.Models;
using CS2InvestmentTracker.Core.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace YourNamespace.Pages
{
    public class IndexModel : PageModel
    {
        private readonly ItemRepository _itemRepository;

        public IndexModel(ItemRepository itemRepository)
        {
            _itemRepository = itemRepository;
        }

        [BindProperty]
        public Item NewItem { get; set; }

        public List<Item> Items { get; set; }

        public async Task OnGetAsync()
        {
            Items = await _itemRepository.GetAllAsync();
        }

        public async Task<IActionResult> OnPostAddAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            NewItem.InsertDate = DateTime.Now;
            NewItem.EditDate = null;
            await _itemRepository.AddAsync(NewItem);
            await _itemRepository.SaveAsync();
            return RedirectToPage();
        }

        public async Task<IActionResult> OnPostDeleteAsync(int id)
        {
            await _itemRepository.DeleteAsync(i => i.Id == id);
            await _itemRepository.SaveAsync();
            return RedirectToPage();
        }

        public async Task<IActionResult> OnPostUpdateAsync(Item item)
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            await _itemRepository.UpdateAsync(item);
            await _itemRepository.SaveAsync();
            return RedirectToPage();
        }
    }
}
