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
    NutritionDto Nutrition,
    List<BatchSummaryDto> Batches
);

public record ProductSummaryDto(
    Guid Id,
    string Gtin,
    string Name,
    string Brand,
    string? ImageUrl,
    string? Category,
    string? NutriScore
);

public record BatchDto(
    Guid Id,
    Guid ProductId,
    string LotNumber,
    ProductStatus Status,
    int RiskScore,
    int? ShelfLifeDays,
    int? DaysRemaining,
    decimal? Co2Kg,
    decimal? WaterLiters,
    DateTime? ProductionDate,
    DateTime? ExpiryDate,
    ProductSummaryDto Product,
    List<JourneyEventDto> JourneyEvents,
    List<PriceStepDto> PriceBreakdown,
    List<TemperatureLogDto> TemperatureLogs,
    List<AlertDto> Alerts
);

public record BatchSummaryDto(
    Guid Id,
    string LotNumber,
    ProductStatus Status,
    int RiskScore,
    DateTime? ProductionDate,
    DateTime? ExpiryDate,
    int? DaysRemaining
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

public record JourneyCoordinatesDto(
    Guid ProductId,
    List<CoordinateDto> Coordinates
);

public record CoordinateDto(
    string Step,
    string Location,
    double Latitude,
    double Longitude,
    int Status
);

public record OcrResultDto(
    string? LotNumber,
    bool Success
);
