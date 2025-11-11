using System.Text.Json.Serialization;

namespace CS2InvestmentTracker.Core.Models;

public class SteamApiResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("lowest_price")]
    public string? LowestPriceString { get; set; }
    public decimal LowestPrice => Convert.ToDecimal(LowestPriceString != null ? LowestPriceString.Replace("€", string.Empty).Replace("-", "0") : "0");

    [JsonPropertyName("volume")]
    public string? VolumeString { get; set; }
    public int Volume => Convert.ToInt32(VolumeString != null ? VolumeString.Replace(",", "") : "0");

    [JsonPropertyName("median_price")]
    public string? MedianPriceString { get; set; }
    public decimal MedianPrice => Convert.ToDecimal(MedianPriceString != null ? MedianPriceString.Replace("€", string.Empty).Replace("-", "0") : "0");
}
