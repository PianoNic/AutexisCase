using System.Text.Json;
using AutexisCase.Domain;

namespace AutexisCase.Infrastructure.Services;

public class OpenFoodFactsService(HttpClient httpClient)
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public async Task<Product?> FetchProductAsync(string gtin, CancellationToken cancellationToken = default)
    {
        var response = await httpClient.GetAsync($"https://world.openfoodfacts.org/api/v2/product/{gtin}.json", cancellationToken);
        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (!root.TryGetProperty("status", out var status) || status.GetInt32() != 1) return null;
        if (!root.TryGetProperty("product", out var p)) return null;

        return new Product
        {
            Gtin = gtin,
            Name = GetString(p, "product_name") ?? GetString(p, "product_name_en") ?? GetString(p, "product_name_de") ?? "Unknown",
            Brand = GetString(p, "brands") ?? "",
            ImageUrl = GetString(p, "image_front_url") ?? GetString(p, "image_url"),
            Category = GetString(p, "categories_tags")?.Split(',').FirstOrDefault()?.Replace("en:", "").Replace("-", " ").Trim(),
            Weight = GetString(p, "quantity"),
            Origin = GetString(p, "origins") ?? GetString(p, "manufacturing_places"),
            NutriScore = GetString(p, "nutriscore_grade")?.ToUpper(),
            NovaGroup = GetInt(p, "nova_group"),
            EcoScore = GetString(p, "ecoscore_grade")?.ToUpper(),
            Certifications = GetLabels(p),
            Nutrition = GetNutrition(p),
        };
    }

    private static string? GetString(JsonElement el, string prop)
    {
        if (el.TryGetProperty(prop, out var val) && val.ValueKind == JsonValueKind.String)
        {
            var s = val.GetString();
            return string.IsNullOrWhiteSpace(s) ? null : s;
        }
        return null;
    }

    private static int? GetInt(JsonElement el, string prop)
    {
        if (el.TryGetProperty(prop, out var val))
        {
            if (val.ValueKind == JsonValueKind.Number) return val.GetInt32();
            if (val.ValueKind == JsonValueKind.String && int.TryParse(val.GetString(), out var i)) return i;
        }
        return null;
    }

    private static decimal GetDecimal(JsonElement el, string prop)
    {
        if (el.TryGetProperty(prop, out var val))
        {
            if (val.ValueKind == JsonValueKind.Number) return val.GetDecimal();
            if (val.ValueKind == JsonValueKind.String && decimal.TryParse(val.GetString(), out var d)) return d;
        }
        return 0;
    }

    private static List<string> GetLabels(JsonElement p)
    {
        var labels = new List<string>();
        if (p.TryGetProperty("labels_tags", out var tags) && tags.ValueKind == JsonValueKind.Array)
        {
            foreach (var tag in tags.EnumerateArray())
            {
                var s = tag.GetString()?.Replace("en:", "").Replace("de:", "").Replace("fr:", "").Replace("-", " ");
                if (!string.IsNullOrWhiteSpace(s))
                    labels.Add(System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(s));
            }
        }
        return labels;
    }

    private static Nutrition GetNutrition(JsonElement p)
    {
        if (!p.TryGetProperty("nutriments", out var n)) return new Nutrition();

        return new Nutrition
        {
            EnergyKcal = GetDecimal(n, "energy-kcal_100g"),
            Fat = GetDecimal(n, "fat_100g"),
            SaturatedFat = GetDecimal(n, "saturated-fat_100g"),
            Carbs = GetDecimal(n, "carbohydrates_100g"),
            Sugars = GetDecimal(n, "sugars_100g"),
            Fiber = GetDecimal(n, "fiber_100g"),
            Protein = GetDecimal(n, "proteins_100g"),
            Salt = GetDecimal(n, "salt_100g"),
        };
    }
}
