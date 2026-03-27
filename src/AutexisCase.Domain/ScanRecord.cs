namespace AutexisCase.Domain;

public class ScanRecord : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public DateTime ScannedAt { get; set; } = DateTime.UtcNow;
}
