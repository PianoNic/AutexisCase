namespace AutexisCase.Domain;

public class TemperatureLog : BaseEntity
{
    public Guid BatchId { get; set; }
    public Batch Batch { get; set; } = null!;

    public DateTime Time { get; set; }
    public decimal Temperature { get; set; }
    public string? Location { get; set; }
}
