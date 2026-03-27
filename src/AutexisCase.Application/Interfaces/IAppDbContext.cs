using AutexisCase.Domain;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<Example> Examples { get; }

    DbSet<User> Users { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
