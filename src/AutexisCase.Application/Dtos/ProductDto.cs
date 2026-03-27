using AutexisCase.Domain.Enums;

namespace AutexisCase.Application.Dtos;

public record ProductDto(
    Guid Id,
    string Gtin,
    string Name,
    string Brand,
    string? ImageUrl,
    string? Category,
    string? Weight,
    string? Origin,
    List<string> Certifications,
    string? NutriScore,
    int? NovaGroup,
    string? EcoScore,
    int RiskScore,
    int? ShelfLifeDays,
    int? DaysRemaining,
    decimal? Co2Kg,
    decimal? WaterLiters,
    ProductStatus Status,
    NutritionDto Nutrition,
    List<JourneyEventDto> JourneyEvents,
    List<PriceStepDto> PriceBreakdown,
    List<TemperatureLogDto> TemperatureLogs,
    List<AlertDto> Alerts
);

public record ProductSummaryDto(
    Guid Id,
    string Gtin,
    string Name,
    string Brand,
    string? ImageUrl,
    string? Category,
    ProductStatus Status,
    string? NutriScore,
    int RiskScore
);

public record NutritionDto(
    decimal EnergyKcal,
    decimal Fat,
    decimal SaturatedFat,
    decimal Carbs,
    decimal Sugars,
    decimal Fiber,
    decimal Protein,
    decimal Salt
);

public record JourneyEventDto(
    Guid Id,
    string Step,
    string Location,
    double Latitude,
    double Longitude,
    DateTime Timestamp,
    JourneyStatus Status,
    string? Icon,
    decimal? Temperature,
    string? Details,
    decimal? Co2Kg,
    decimal? WaterLiters,
    decimal? Cost
);

public record PriceStepDto(
    Guid Id,
    string Stage,
    decimal Amount,
    decimal Percentage
);

public record TemperatureLogDto(
    Guid Id,
    DateTime Time,
    decimal Temperature,
    string? Location
);

public record AlertDto(
    Guid Id,
    AlertType Type,
    AlertSeverity Severity,
    string Title,
    string? Description,
    DateTime Timestamp,
    bool Read
);
