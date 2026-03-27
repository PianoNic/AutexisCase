using AutexisCase.Domain.Enums;

namespace AutexisCase.Domain;

public class Alert : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public AlertType Type { get; set; }
    public AlertSeverity Severity { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public DateTime Timestamp { get; set; }
    public bool Read { get; set; }
}
