using AutexisCase.Application.Interfaces;
using AutexisCase.Domain;
using AutexisCase.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Infrastructure.Services;

public class UserSyncService(AutexisCaseDbContext dbContext) : IUserSyncService
{
    public async Task<User> SyncUserAsync(string externalId, string email, string displayName, string? avatarUrl = null, CancellationToken cancellationToken = default)
    {
        User? user = await dbContext.Users.Include(u => u.Roles).SingleOrDefaultAsync(u => u.ExternalId == externalId, cancellationToken);

        if (user is null)
        {
            user = new User
            {
                ExternalId = externalId,
                Email = email,
                DisplayName = displayName,
                AvatarUrl = avatarUrl,
                LastLoginAt = DateTime.UtcNow,
                Roles = [new UserRoleAssignment { Role = UserRole.Unknown }]
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

        await dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }
}
