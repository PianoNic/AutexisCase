namespace AutexisCase.Application.Dtos;

public record UserDto(Guid Id, string ExternalId, string Email, string DisplayName, string? AvatarUrl);
