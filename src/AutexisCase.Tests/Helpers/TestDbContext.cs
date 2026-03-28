using AutexisCase.Application.Interfaces;
using AutexisCase.Domain;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Tests.Helpers;

public class TestDbContext : DbContext, IAppDbContext
{
    public TestDbContext(DbContextOptions<TestDbContext> options) : base(options) { }

    public DbSet<Example> Examples => Set<Example>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserRoleAssignment> UserRoleAssignments => Set<UserRoleAssignment>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Batch> Batches => Set<Batch>();
    public DbSet<JourneyEvent> JourneyEvents => Set<JourneyEvent>();
    public DbSet<PriceStep> PriceSteps => Set<PriceStep>();
    public DbSet<TemperatureLog> TemperatureLogs => Set<TemperatureLog>();
    public DbSet<Alert> Alerts => Set<Alert>();
    public DbSet<ScanRecord> ScanRecords => Set<ScanRecord>();
    public DbSet<RouteCache> RouteCaches => Set<RouteCache>();
    public DbSet<EpcisEvent> EpcisEvents => Set<EpcisEvent>();

    public static TestDbContext Create()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var ctx = new TestDbContext(options);
        ctx.Database.EnsureCreated();
        return ctx;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>()
            .OwnsOne(p => p.Nutrition);

        modelBuilder.Entity<Batch>()
            .HasMany(b => b.JourneyEvents)
            .WithOne(j => j.Batch)
            .HasForeignKey(j => j.BatchId);

        modelBuilder.Entity<Batch>()
            .HasOne(b => b.Product)
            .WithMany(p => p.Batches)
            .HasForeignKey(b => b.ProductId);

        modelBuilder.Entity<ScanRecord>()
            .HasOne(s => s.Product)
            .WithMany()
            .HasForeignKey(s => s.ProductId);

        modelBuilder.Entity<ScanRecord>()
            .HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId);
    }
}
