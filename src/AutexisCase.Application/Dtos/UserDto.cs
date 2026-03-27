using AutexisCase.Domain.Enums;

namespace AutexisCase.Application.Dtos;

public record UserDto(Guid Id, string Email, string DisplayName, string? AvatarUrl, List<UserRole>? Roles, DateTime CreatedAt);
