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

            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                // Race condition: user was created by another request
                dbContext.Entry(user).State = EntityState.Detached;
                user = await dbContext.Users.Include(u => u.Roles).FirstAsync(u => u.ExternalId == externalId, cancellationToken);
            }
        }

        user.Email = email;
        user.DisplayName = displayName;
        user.AvatarUrl = avatarUrl ?? user.AvatarUrl;
        user.LastLoginAt = DateTime.UtcNow;

        // Sync roles from OIDC provider
        if (roles is not null)
        {
            var existingRoles = user.Roles.Select(r => r.Role).ToHashSet();
            foreach (var role in roles.Where(r => !existingRoles.Contains(r)))
            {
                user.Roles.Add(new UserRoleAssignment { UserId = user.Id, Role = role });
            }
            var toRemove = user.Roles.Where(r => !roles.Contains(r.Role)).ToList();
            foreach (var r in toRemove) user.Roles.Remove(r);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }
}
