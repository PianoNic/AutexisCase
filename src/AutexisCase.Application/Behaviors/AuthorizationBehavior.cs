using System.Reflection;
using AutexisCase.Application.Interfaces;
using AutexisCase.Domain.Enums;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Behaviors;

public class AuthorizationBehavior<TMessage, TResponse>(ICurrentUserService currentUserService, IAppDbContext dbContext) : IPipelineBehavior<TMessage, TResponse> where TMessage : IMessage
{
    public async ValueTask<TResponse> Handle(TMessage message, MessageHandlerDelegate<TMessage, TResponse> next, CancellationToken cancellationToken)
    {
        var type = message.GetType();
        var rolesAttribute = type.GetCustomAttribute<AuthorizedRolesAttribute>();
        var allowAuthenticated = type.GetCustomAttribute<AllowAuthenticatedAttribute>();

        if (rolesAttribute is null && allowAuthenticated is null)
            throw new InvalidOperationException($"Missing authorization attribute on {type.Name}. Add [AuthorizedRoles(...)] or [AllowAuthenticated].");

        if (allowAuthenticated is not null)
            return await next(message, cancellationToken);

        if (currentUserService.ExternalId is null)
            throw new UnauthorizedAccessException("User is not authenticated.");

        var user = await dbContext.Users.AsNoTracking().Include(u => u.Roles).SingleOrDefaultAsync(u => u.ExternalId == currentUserService.ExternalId, cancellationToken);
        if (user is null)
            throw new UnauthorizedAccessException("User not found.");

        if (!user.Roles.Any(r => rolesAttribute!.Roles.Contains(r.Role)))
            throw new UnauthorizedAccessException("User is not authorized for this action.");

        return await next(message, cancellationToken);
    }
}
