using AutexisCase.Application.Dtos;
using AutexisCase.Domain;

namespace AutexisCase.Application.Mappers;

public static class ProductMapper
{
    public static ProductDto ToDto(this Product p) => new(
        p.Id, p.Gtin, p.Name, p.Brand, p.ImageUrl, p.Category, p.Weight, p.Origin,
        p.Certifications, p.NutriScore, p.NovaGroup, p.EcoScore, p.RiskScore,
        p.ShelfLifeDays, p.DaysRemaining, p.Co2Kg, p.WaterLiters, p.Status,
        p.Nutrition.ToDto(),
        p.JourneyEvents.Select(j => j.ToDto()).ToList(),
        p.PriceBreakdown.Select(s => s.ToDto()).ToList(),
        p.TemperatureLogs.Select(t => t.ToDto()).ToList(),
        p.Alerts.Select(a => a.ToDto()).ToList()
    );

    public static ProductSummaryDto ToSummaryDto(this Product p) => new(
        p.Id, p.Gtin, p.Name, p.Brand, p.ImageUrl, p.Category, p.Status, p.NutriScore, p.RiskScore
    );

    public static NutritionDto ToDto(this Nutrition n) => new(
        n.EnergyKcal, n.Fat, n.SaturatedFat, n.Carbs, n.Sugars, n.Fiber, n.Protein, n.Salt
    );

    public static JourneyEventDto ToDto(this JourneyEvent j) => new(
        j.Id, j.Step, j.Location, j.Latitude, j.Longitude, j.Timestamp, j.Status,
        j.Icon, j.Temperature, j.Details, j.Co2Kg, j.WaterLiters, j.Cost
    );

    public static PriceStepDto ToDto(this PriceStep s) => new(s.Id, s.Stage, s.Amount, s.Percentage);

    public static TemperatureLogDto ToDto(this TemperatureLog t) => new(t.Id, t.Time, t.Temperature, t.Location);

    public static AlertDto ToDto(this Alert a) => new(a.Id, a.Type, a.Severity, a.Title, a.Description, a.Timestamp, a.Read);
}
