using AutexisCase.Domain.Enums;

namespace AutexisCase.Domain;

public class JourneyEvent : BaseEntity
{
    public Guid BatchId { get; set; }
    public Batch Batch { get; set; } = null!;

    public required string Step { get; set; }
    public required string Location { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public DateTime Timestamp { get; set; }
    public JourneyStatus Status { get; set; } = JourneyStatus.Completed;
    public string? Icon { get; set; }
    public decimal? Temperature { get; set; }
    public string? Details { get; set; }
    public decimal? Co2Kg { get; set; }
    public decimal? WaterLiters { get; set; }
    public decimal? Cost { get; set; }
}
