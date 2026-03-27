using AutexisCase.Domain.Enums;

namespace AutexisCase.Domain;

public class UserRoleAssignment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public UserRole Role { get; set; }
    public User User { get; set; } = null!;
}
