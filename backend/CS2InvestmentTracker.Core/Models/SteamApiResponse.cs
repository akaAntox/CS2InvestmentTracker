using System.Globalization;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace CS2InvestmentTracker.Core.Models;

public class SteamApiResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("lowest_price")]
    public string? LowestPriceString { get; set; }
    public decimal LowestPrice => ParsePrice(LowestPriceString);

    [JsonPropertyName("volume")]
    public string? VolumeString { get; set; }
    public int Volume => ParseVolume(VolumeString);

    [JsonPropertyName("median_price")]
    public string? MedianPriceString { get; set; }
    public decimal MedianPrice => ParsePrice(MedianPriceString);


    private static decimal ParsePrice(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return 0m;

        // Example raw: "1,60€", "€ 1,60", "1.600,25€", etc.
        // 1) Keep only digits, comma and dot
        var numeric = Regex.Replace(raw, @"[^\d,\.]", "");

        if (string.IsNullOrWhiteSpace(numeric))
            return 0m;

        //    "1.600,25" -> "1600,25" -> "1600.25"
        numeric = numeric.Replace(".", "");   // remove thousands separator
        numeric = numeric.Replace(",", ".");  // unify decimal separator

        // 3) Parse using invariant culture
        if (decimal.TryParse(
                numeric,
                NumberStyles.Number,
                CultureInfo.InvariantCulture,
                out var value))
        {
            return value;
        }

        return 0m;
    }

    private static int ParseVolume(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return 0;

        // Volume is usually something like "123" or "1,234"
        var numeric = Regex.Replace(raw, @"[^\d]", "");

        return int.TryParse(
            numeric,
            NumberStyles.Integer,
            CultureInfo.InvariantCulture,
            out var v)
            ? v
            : 0;
    }
}
