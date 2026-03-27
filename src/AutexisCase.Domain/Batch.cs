using AutexisCase.Domain.Enums;

namespace AutexisCase.Domain;

public class Batch : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public required string LotNumber { get; set; }
    public ProductStatus Status { get; set; } = ProductStatus.Ok;
    public int RiskScore { get; set; }
    public int? ShelfLifeDays { get; set; }
    public int? DaysRemaining { get; set; }
    public decimal? Co2Kg { get; set; }
    public decimal? WaterLiters { get; set; }
    public DateTime? ProductionDate { get; set; }
    public DateTime? ExpiryDate { get; set; }

    public List<JourneyEvent> JourneyEvents { get; set; } = [];
    public List<PriceStep> PriceBreakdown { get; set; } = [];
    public List<TemperatureLog> TemperatureLogs { get; set; } = [];
    public List<Alert> Alerts { get; set; } = [];
}
