using AutexisCase.Domain.Enums;

namespace AutexisCase.Domain;

public class Product : BaseEntity
{
    public required string Gtin { get; set; }
    public required string Name { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? Category { get; set; }
    public string? Weight { get; set; }
    public string? Origin { get; set; }
    public List<string> Certifications { get; set; } = [];

    public string? NutriScore { get; set; }
    public int? NovaGroup { get; set; }
    public string? EcoScore { get; set; }
    public int RiskScore { get; set; }
    public int? ShelfLifeDays { get; set; }
    public int? DaysRemaining { get; set; }

    public decimal? Co2Kg { get; set; }
    public decimal? WaterLiters { get; set; }

    public ProductStatus Status { get; set; } = ProductStatus.Ok;

    public Nutrition Nutrition { get; set; } = new();

    public List<JourneyEvent> JourneyEvents { get; set; } = [];
    public List<PriceStep> PriceBreakdown { get; set; } = [];
    public List<TemperatureLog> TemperatureLogs { get; set; } = [];
    public List<Alert> Alerts { get; set; } = [];
}
