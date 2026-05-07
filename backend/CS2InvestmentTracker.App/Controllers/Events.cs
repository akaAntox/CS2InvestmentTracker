using CS2InvestmentTracker.Core.Repositories.Custom;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace CS2InvestmentTracker.App.Controllers;

[Route("api/[controller]")]
[ApiController]
public class EventsController(ILogger<EventsController> logger, EventLogRepository eventLogRepository, UserManager<IdentityUser> userManager) : ControllerBase
{    
    [HttpGet]
    [SwaggerOperation(Summary = "Get all events from the event log")]
    public async Task<IActionResult> GetEvents()
    {
        try
        {
            logger.LogInformation("Fetching all events from the event log");
            var events = await eventLogRepository.GetAllAsync();
            return Ok(events);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while fetching events from the event log");
            return StatusCode(500, "An error occurred while fetching events");
        }
    }
}
