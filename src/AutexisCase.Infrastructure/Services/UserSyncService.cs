using AutexisCase.Application.Interfaces;
using AutexisCase.Domain;
using AutexisCase.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Infrastructure.Services;

public class UserSyncService(AutexisCaseDbContext dbContext) : IUserSyncService
{
    public async Task<User> SyncUserAsync(string externalId, string email, string displayName, string? avatarUrl = null, CancellationToken cancellationToken = default, List<UserRole>? roles = null)
    {
        User? user = await dbContext.Users.Include(u => u.Roles).FirstOrDefaultAsync(u => u.ExternalId == externalId, cancellationToken);

        if (user is null)
        {
            user = new User
            {
                ExternalId = externalId,
                Email = email,
                DisplayName = displayName,
                AvatarUrl = avatarUrl,
                LastLoginAt = DateTime.UtcNow,
                Roles = []
            };
            dbContext.Users.Add(user);
        }
        else
        {
            user.Email = email;
            user.DisplayName = displayName;
            user.AvatarUrl = avatarUrl ?? user.AvatarUrl;
            user.LastLoginAt = DateTime.UtcNow;
        }

        // Sync roles from OIDC provider
        if (roles is not null)
        {
            var existingRoles = user.Roles.Select(r => r.Role).ToHashSet();
            foreach (var role in roles.Where(r => !existingRoles.Contains(r)))
            {
                user.Roles.Add(new UserRoleAssignment { UserId = user.Id, Role = role });
            }
            // Remove roles no longer assigned
            user.Roles.RemoveAll(r => !roles.Contains(r.Role));
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }
}
