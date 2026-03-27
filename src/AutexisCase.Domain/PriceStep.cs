namespace AutexisCase.Domain;

public class PriceStep : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public required string Stage { get; set; }
    public decimal Amount { get; set; }
    public decimal Percentage { get; set; }
}
