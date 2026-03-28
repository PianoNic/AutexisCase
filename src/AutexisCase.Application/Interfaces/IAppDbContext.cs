using AutexisCase.Domain;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<Example> Examples { get; }

    DbSet<User> Users { get; }

    DbSet<UserRoleAssignment> UserRoleAssignments { get; }

    DbSet<Product> Products { get; }
    DbSet<Batch> Batches { get; }
    DbSet<JourneyEvent> JourneyEvents { get; }
    DbSet<PriceStep> PriceSteps { get; }
    DbSet<TemperatureLog> TemperatureLogs { get; }
    DbSet<Alert> Alerts { get; }
    DbSet<ScanRecord> ScanRecords { get; }
    DbSet<RouteCache> RouteCaches { get; }
    DbSet<EpcisEvent> EpcisEvents { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
