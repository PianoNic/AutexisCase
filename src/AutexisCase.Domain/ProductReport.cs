namespace AutexisCase.Domain;

public class ProductReport : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public Guid? BatchId { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public required string Reason { get; set; }
    public string? Details { get; set; }
    public bool Resolved { get; set; }
}
