using AutexisCase.Domain.Enums;

namespace AutexisCase.Application.Behaviors;

[AttributeUsage(AttributeTargets.Class)]
public class AuthorizedRolesAttribute(params UserRole[] roles) : Attribute
{
    public UserRole[] Roles { get; } = roles;
}

[AttributeUsage(AttributeTargets.Class)]
public class AllowAuthenticatedAttribute : Attribute;
