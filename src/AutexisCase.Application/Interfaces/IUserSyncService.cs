using AutexisCase.Domain;
using AutexisCase.Domain.Enums;

namespace AutexisCase.Application.Interfaces;

public interface IUserSyncService
{
    Task<User> SyncUserAsync(string externalId, string email, string displayName, string? avatarUrl = null, CancellationToken cancellationToken = default, List<UserRole>? roles = null);
}
