using AutexisCase.Application.Dtos;
using AutexisCase.Domain;

namespace AutexisCase.Application.Mappers;

public static class UserMapper
{
    public static UserDto ToDto(this User user)
    {
        return new UserDto(user.Id, user.Email, user.DisplayName, user.AvatarUrl, user.Roles.Select(r => r.Role).ToList(), user.CreatedAt);
    }
}
