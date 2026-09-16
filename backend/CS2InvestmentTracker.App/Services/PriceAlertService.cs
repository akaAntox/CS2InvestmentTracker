using CS2InvestmentTracker.Core.Models.Database;
using CS2InvestmentTracker.Core.Repositories.Custom;

namespace CS2InvestmentTracker.App.Services;

// Fires the price alerts reached after a price update. They are always written to the event log,
// and also sent to Telegram when Alerts:TelegramBotToken and Alerts:TelegramChatId are configured.
public class PriceAlertService(
    IServiceScopeFactory serviceScopeFactory,
    IConfiguration configuration,
    ILogger<PriceAlertService> logger)
{
    // Not from IHttpClientFactory: its request logging would write the bot token (part of the URL) to the log
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(15) };

    public async Task CheckAsync()
    {
        try
        {
            using var scope = serviceScopeFactory.CreateScope();
            var itemRepository = scope.ServiceProvider.GetRequiredService<ItemRepository>();
            var eventLogRepository = scope.ServiceProvider.GetRequiredService<EventLogRepository>();

            var messages = await itemRepository.TriggerAlertsAsync();
            foreach (var message in messages)
                await eventLogRepository.NewEvent(ActionType.Alert, $"Price alert: {message}");

            if (messages.Count > 0)
                await SendTelegramAsync(string.Join("\n", messages));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error while checking price alerts: {Message}", ex.Message);
        }
    }

    private async Task SendTelegramAsync(string text)
    {
        var token = configuration["Alerts:TelegramBotToken"];
        var chatId = configuration["Alerts:TelegramChatId"];
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(chatId))
        {
            logger.LogInformation("Price alerts written to the event log only: Telegram is not configured");
            return;
        }

        using var response = await Http.PostAsJsonAsync(
            $"https://api.telegram.org/bot{token}/sendMessage",
            new { chat_id = chatId, text });
        response.EnsureSuccessStatusCode();
    }
}
