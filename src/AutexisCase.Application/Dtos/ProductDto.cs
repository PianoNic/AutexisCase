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

public record RouteSegmentDto(
    string FromStep,
    string ToStep,
    string FromLocation,
    string ToLocation,
    List<double[]> Points
);

public record RouteDto(
    List<RouteSegmentDto> Segments
);

public record PointToPointRouteDto(
    List<double[]> Points
);

public record OcrResultDto(
    string? LotNumber,
    bool Success
);

public record ShelfLifePredictionDto(
    int PredictedDaysRemaining,
    double Confidence,
    List<QualityDataPointDto> QualityProgression,
    List<RiskFactorDto> RiskFactors,
    string Recommendation
);

public record QualityDataPointDto(int Day, double Quality, string Label);

public record RiskFactorDto(string Id, string Factor, string Impact, string Description);

public record AnomalyDetectionResultDto(
    List<ColdChainAnomalyDto> Anomalies,
    string OverallRisk,
    int ChainIntegrityScore
);

public record ColdChainAnomalyDto(
    string Id, string Severity, string Type, string Title, string Description,
    decimal MinTemp, decimal MaxTemp, string Duration, int AffectedQualityPercent
);

public record SustainabilityAnalysisDto(
    List<Co2BreakdownItemDto> Co2Breakdown,
    decimal TotalCo2Kg,
    int ComparisonToAverage,
    decimal WaterFootprintL,
    int TransportDistanceKm,
    string PackagingScore,
    List<string> EcoTips
);

public record Co2BreakdownItemDto(string Id, string Stage, decimal Co2Kg, int Percentage);

public record ProductAlternativesDto(
    List<AlternativeProductDto> Alternatives
);

public record AlternativeProductDto(
    Guid Id, string Name, string Brand, string? ImageUrl, string? NutriScore,
    decimal Co2Kg, List<string> ImprovementTags
);

public record BlockDto(
    int Index,
    string Hash,
    string PreviousHash,
    DateTime Timestamp,
    string Step,
    string Location,
    string Carrier,
    decimal? Temperature,
    bool IsValid
);

public record ChatMessageDto(
    string Role,
    string Content
);

public record ChatResponseDto(
    string Answer
);

public record BlockchainDto(
    Guid BatchId,
    string LotNumber,
    string Gtin,
    List<BlockDto> Blocks,
    bool ChainValid
);
