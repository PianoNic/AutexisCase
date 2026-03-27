namespace AutexisCase.Domain;

public class PriceStep : BaseEntity
{
    public Guid BatchId { get; set; }
    public Batch Batch { get; set; } = null!;

    public required string Stage { get; set; }
    public decimal Amount { get; set; }
    public decimal Percentage { get; set; }
}
