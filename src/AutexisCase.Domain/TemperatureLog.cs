namespace AutexisCase.Domain;

public class TemperatureLog : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public DateTime Time { get; set; }
    public decimal Temperature { get; set; }
    public string? Location { get; set; }
}
