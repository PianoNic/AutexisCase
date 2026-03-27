using AutexisCase.Application.Interfaces;
using AutexisCase.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace AutexisCase.Infrastructure;

public class AutexisCaseDbContext(DbContextOptions<AutexisCaseDbContext> options) : DbContext(options), IAppDbContext
{
    public DbSet<Example> Examples => Set<Example>();

    public DbSet<User> Users => Set<User>();


    protected override void OnModelCreating(ModelBuilder modelBuilder) => modelBuilder.ApplyConfigurationsFromAssembly(typeof(AutexisCaseDbContext).Assembly);

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;

        return base.SaveChangesAsync(cancellationToken);
    }
}


public class AutexisCaseDbContextFactory : IDesignTimeDbContextFactory<AutexisCaseDbContext>
{
    public AutexisCaseDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AutexisCaseDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Port=5433;Database=autexiscasedb-dev;Username=autexiscase;Password=devpassword");
        return new AutexisCaseDbContext(optionsBuilder.Options);
    }
}


