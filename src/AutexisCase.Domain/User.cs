namespace AutexisCase.Domain;

public class User : BaseEntity
{
    public required string ExternalId { get; init; }
    public required string Email { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public List<UserRoleAssignment> Roles { get; set; } = [];
    public string? AvatarUrl { get; set; }
    public DateTime? LastLoginAt { get; set; }
}
