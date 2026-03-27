namespace AutexisCase.Domain;

public class User : BaseEntity
{
    public string ExternalId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime LastLoginAt { get; set; } = DateTime.UtcNow;
}
