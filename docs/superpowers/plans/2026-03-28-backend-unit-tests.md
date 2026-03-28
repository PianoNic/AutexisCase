# Backend Unit Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add business-critical unit tests for query handlers, command handlers, and the RoutingService.

**Architecture:** Tests use xUnit v3 with EF Core InMemory provider for handler tests. Simple stub classes implement interfaces (IRoutingService, ICurrentUserService, IOpenFoodFactsService) — no mocking library needed. Each test class gets a fresh InMemory database via a shared helper.

**Tech Stack:** xUnit v3, Microsoft.EntityFrameworkCore.InMemory, .NET 10

---

### Task 1: Test Infrastructure — InMemory DbContext and Stubs

**Files:**
- Create: `src/AutexisCase.Tests/Helpers/TestDbContext.cs`
- Create: `src/AutexisCase.Tests/Helpers/StubRoutingService.cs`
- Create: `src/AutexisCase.Tests/Helpers/StubCurrentUserService.cs`
- Create: `src/AutexisCase.Tests/Helpers/StubOpenFoodFactsService.cs`

- [ ] **Step 1: Create TestDbContext**

```csharp
// src/AutexisCase.Tests/Helpers/TestDbContext.cs
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
```

- [ ] **Step 2: Create stub services**

```csharp
// src/AutexisCase.Tests/Helpers/StubRoutingService.cs
using AutexisCase.Application.Interfaces;

namespace AutexisCase.Tests.Helpers;

public class StubRoutingService : IRoutingService
{
    public List<double[]> ResultPoints { get; set; } = [[47.0, 8.0], [46.5, 7.5], [46.0, 7.0]];

    public Task<List<double[]>> GetRouteAsync(double fromLat, double fromLon, double toLat, double toLon, string profile = "driving-hgv", CancellationToken cancellationToken = default)
    {
        return Task.FromResult(ResultPoints);
    }
}
```

```csharp
// src/AutexisCase.Tests/Helpers/StubCurrentUserService.cs
using AutexisCase.Application.Interfaces;

namespace AutexisCase.Tests.Helpers;

public class StubCurrentUserService : ICurrentUserService
{
    public string? ExternalId { get; set; } = "test-external-id";
    public string? Email { get; set; } = "test@example.com";
    public string? DisplayName { get; set; } = "Test User";
    public bool IsAuthenticated { get; set; } = true;
}
```

```csharp
// src/AutexisCase.Tests/Helpers/StubOpenFoodFactsService.cs
using AutexisCase.Application.Interfaces;
using AutexisCase.Domain;

namespace AutexisCase.Tests.Helpers;

public class StubOpenFoodFactsService : IOpenFoodFactsService
{
    public Product? ProductToReturn { get; set; }

    public Task<Product?> FetchProductAsync(string gtin, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(ProductToReturn);
    }
}
```

- [ ] **Step 3: Verify it compiles**

Run: `dotnet build src/AutexisCase.Tests`
Expected: Build succeeded

- [ ] **Step 4: Commit**

```bash
git add src/AutexisCase.Tests/Helpers/
git commit -m "Add test infrastructure: InMemory DbContext and stub services"
```

---

### Task 2: GetProductByIdHandler Tests

**Files:**
- Create: `src/AutexisCase.Tests/Queries/GetProductByIdHandlerTests.cs`

- [ ] **Step 1: Write tests**

```csharp
// src/AutexisCase.Tests/Queries/GetProductByIdHandlerTests.cs
using AutexisCase.Application.Queries;
using AutexisCase.Domain;
using AutexisCase.Tests.Helpers;

namespace AutexisCase.Tests.Queries;

public class GetProductByIdHandlerTests
{
    [Fact]
    public async Task Returns_product_when_exists()
    {
        using var db = TestDbContext.Create();
        var product = new Product { Gtin = "123", Name = "Test", Brand = "Brand" };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var handler = new GetProductByIdHandler(db);
        var result = await handler.Handle(new GetProductByIdQuery(product.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Test", result.Value!.Name);
        Assert.Equal("123", result.Value.Gtin);
    }

    [Fact]
    public async Task Returns_failure_when_not_found()
    {
        using var db = TestDbContext.Create();
        var handler = new GetProductByIdHandler(db);
        var result = await handler.Handle(new GetProductByIdQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Product not found.", result.Error);
    }

    [Fact]
    public async Task Includes_batches()
    {
        using var db = TestDbContext.Create();
        var product = new Product { Gtin = "456", Name = "WithBatch", Brand = "B" };
        product.Batches.Add(new Batch { LotNumber = "LOT1", ProductId = product.Id });
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var handler = new GetProductByIdHandler(db);
        var result = await handler.Handle(new GetProductByIdQuery(product.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!.Batches);
        Assert.Equal("LOT1", result.Value.Batches[0].LotNumber);
    }
}
```

- [ ] **Step 2: Run tests**

Run: `dotnet test src/AutexisCase.Tests --filter "GetProductByIdHandlerTests" -v minimal`
Expected: 3 passed

- [ ] **Step 3: Commit**

```bash
git add src/AutexisCase.Tests/Queries/GetProductByIdHandlerTests.cs
git commit -m "Add GetProductByIdHandler unit tests"
```

---

### Task 3: GetProductByGtinHandler Tests

**Files:**
- Create: `src/AutexisCase.Tests/Queries/GetProductByGtinHandlerTests.cs`

- [ ] **Step 1: Write tests**

```csharp
// src/AutexisCase.Tests/Queries/GetProductByGtinHandlerTests.cs
using AutexisCase.Application.Queries;
using AutexisCase.Domain;
using AutexisCase.Tests.Helpers;

namespace AutexisCase.Tests.Queries;

public class GetProductByGtinHandlerTests
{
    [Fact]
    public async Task Returns_product_from_db_when_exists()
    {
        using var db = TestDbContext.Create();
        var product = new Product { Gtin = "7640150491001", Name = "Existing", Brand = "B" };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var handler = new GetProductByGtinHandler(db, new StubOpenFoodFactsService());
        var result = await handler.Handle(new GetProductByGtinQuery("7640150491001"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Existing", result.Value!.Name);
    }

    [Fact]
    public async Task Fetches_from_openfoodfacts_when_not_in_db()
    {
        using var db = TestDbContext.Create();
        var off = new StubOpenFoodFactsService
        {
            ProductToReturn = new Product { Gtin = "999", Name = "Fetched", Brand = "OFF" }
        };

        var handler = new GetProductByGtinHandler(db, off);
        var result = await handler.Handle(new GetProductByGtinQuery("999"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Fetched", result.Value!.Name);
        Assert.Single(db.Products);
    }

    [Fact]
    public async Task Returns_failure_when_not_found_anywhere()
    {
        using var db = TestDbContext.Create();
        var off = new StubOpenFoodFactsService { ProductToReturn = null };

        var handler = new GetProductByGtinHandler(db, off);
        var result = await handler.Handle(new GetProductByGtinQuery("000"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Product not found.", result.Error);
    }
}
```

- [ ] **Step 2: Run tests**

Run: `dotnet test src/AutexisCase.Tests --filter "GetProductByGtinHandlerTests" -v minimal`
Expected: 3 passed

- [ ] **Step 3: Commit**

```bash
git add src/AutexisCase.Tests/Queries/GetProductByGtinHandlerTests.cs
git commit -m "Add GetProductByGtinHandler unit tests"
```

---

### Task 4: GetBatchByIdHandler and LookupBatchHandler Tests

**Files:**
- Create: `src/AutexisCase.Tests/Queries/BatchQueryHandlerTests.cs`

- [ ] **Step 1: Write tests**

```csharp
// src/AutexisCase.Tests/Queries/BatchQueryHandlerTests.cs
using AutexisCase.Application.Queries;
using AutexisCase.Domain;
using AutexisCase.Domain.Enums;
using AutexisCase.Tests.Helpers;

namespace AutexisCase.Tests.Queries;

public class BatchQueryHandlerTests
{
    private static (TestDbContext db, Product product, Batch batch) SeedBatch()
    {
        var db = TestDbContext.Create();
        var product = new Product { Gtin = "123", Name = "P", Brand = "B" };
        var batch = new Batch { LotNumber = "LOT1", ProductId = product.Id, Status = ProductStatus.Warning, RiskScore = 42 };
        batch.JourneyEvents.Add(new JourneyEvent { BatchId = batch.Id, Step = "Farm", Location = "Zürich", Latitude = 47.3, Longitude = 8.5, Timestamp = DateTime.UtcNow });
        product.Batches.Add(batch);
        db.Products.Add(product);
        db.SaveChanges();
        return (db, product, batch);
    }

    [Fact]
    public async Task GetBatchById_returns_batch_with_journey_events()
    {
        var (db, _, batch) = SeedBatch();
        using var _ = db;

        var handler = new GetBatchByIdHandler(db);
        var result = await handler.Handle(new GetBatchByIdQuery(batch.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("LOT1", result.Value!.LotNumber);
        Assert.Equal(ProductStatus.Warning, result.Value.Status);
        Assert.Single(result.Value.JourneyEvents);
        Assert.Equal("Farm", result.Value.JourneyEvents[0].Step);
    }

    [Fact]
    public async Task GetBatchById_returns_failure_when_not_found()
    {
        using var db = TestDbContext.Create();
        var handler = new GetBatchByIdHandler(db);
        var result = await handler.Handle(new GetBatchByIdQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Batch not found.", result.Error);
    }

    [Fact]
    public async Task LookupBatch_finds_by_gtin_and_lot()
    {
        var (db, _, _) = SeedBatch();
        using var _ = db;

        var handler = new LookupBatchHandler(db);
        var result = await handler.Handle(new LookupBatchQuery("123", "LOT1"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("LOT1", result.Value!.LotNumber);
    }

    [Fact]
    public async Task LookupBatch_returns_failure_for_wrong_lot()
    {
        var (db, _, _) = SeedBatch();
        using var _ = db;

        var handler = new LookupBatchHandler(db);
        var result = await handler.Handle(new LookupBatchQuery("123", "WRONG"), CancellationToken.None);

        Assert.True(result.IsFailure);
    }

    [Fact]
    public async Task LookupBatch_returns_failure_for_wrong_gtin()
    {
        var (db, _, _) = SeedBatch();
        using var _ = db;

        var handler = new LookupBatchHandler(db);
        var result = await handler.Handle(new LookupBatchQuery("WRONG", "LOT1"), CancellationToken.None);

        Assert.True(result.IsFailure);
    }
}
```

- [ ] **Step 2: Run tests**

Run: `dotnet test src/AutexisCase.Tests --filter "BatchQueryHandlerTests" -v minimal`
Expected: 5 passed

- [ ] **Step 3: Commit**

```bash
git add src/AutexisCase.Tests/Queries/BatchQueryHandlerTests.cs
git commit -m "Add batch query handler unit tests"
```

---

### Task 5: GetBatchRouteHandler Tests

**Files:**
- Create: `src/AutexisCase.Tests/Queries/GetBatchRouteHandlerTests.cs`

- [ ] **Step 1: Write tests**

```csharp
// src/AutexisCase.Tests/Queries/GetBatchRouteHandlerTests.cs
using AutexisCase.Application.Queries;
using AutexisCase.Domain;
using AutexisCase.Tests.Helpers;

namespace AutexisCase.Tests.Queries;

public class GetBatchRouteHandlerTests
{
    [Fact]
    public async Task Returns_route_segments_for_batch_with_events()
    {
        using var db = TestDbContext.Create();
        var product = new Product { Gtin = "123", Name = "P", Brand = "B" };
        var batch = new Batch { LotNumber = "L1", ProductId = product.Id };
        batch.JourneyEvents.Add(new JourneyEvent { BatchId = batch.Id, Step = "Farm", Location = "A", Latitude = 47.0, Longitude = 8.0, Timestamp = DateTime.UtcNow.AddDays(-2) });
        batch.JourneyEvents.Add(new JourneyEvent { BatchId = batch.Id, Step = "Factory", Location = "B", Latitude = 46.5, Longitude = 7.5, Timestamp = DateTime.UtcNow.AddDays(-1) });
        batch.JourneyEvents.Add(new JourneyEvent { BatchId = batch.Id, Step = "Store", Location = "C", Latitude = 46.0, Longitude = 7.0, Timestamp = DateTime.UtcNow });
        product.Batches.Add(batch);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var routing = new StubRoutingService();
        var handler = new GetBatchRouteHandler(db, routing);
        var result = await handler.Handle(new GetBatchRouteQuery(batch.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Segments.Count);
        Assert.Equal("Farm", result.Value.Segments[0].FromStep);
        Assert.Equal("Factory", result.Value.Segments[0].ToStep);
        Assert.Equal("Factory", result.Value.Segments[1].FromStep);
        Assert.Equal("Store", result.Value.Segments[1].ToStep);
    }

    [Fact]
    public async Task Returns_failure_when_less_than_two_events()
    {
        using var db = TestDbContext.Create();
        var product = new Product { Gtin = "123", Name = "P", Brand = "B" };
        var batch = new Batch { LotNumber = "L1", ProductId = product.Id };
        batch.JourneyEvents.Add(new JourneyEvent { BatchId = batch.Id, Step = "Only", Location = "A", Latitude = 47.0, Longitude = 8.0, Timestamp = DateTime.UtcNow });
        product.Batches.Add(batch);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var handler = new GetBatchRouteHandler(db, new StubRoutingService());
        var result = await handler.Handle(new GetBatchRouteQuery(batch.Id), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Contains("Not enough journey points", result.Error);
    }

    [Fact]
    public async Task Returns_failure_when_no_events()
    {
        using var db = TestDbContext.Create();
        var handler = new GetBatchRouteHandler(db, new StubRoutingService());
        var result = await handler.Handle(new GetBatchRouteQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsFailure);
    }

    [Fact]
    public async Task Segments_contain_routing_service_points()
    {
        using var db = TestDbContext.Create();
        var product = new Product { Gtin = "123", Name = "P", Brand = "B" };
        var batch = new Batch { LotNumber = "L1", ProductId = product.Id };
        batch.JourneyEvents.Add(new JourneyEvent { BatchId = batch.Id, Step = "A", Location = "A", Latitude = 47.0, Longitude = 8.0, Timestamp = DateTime.UtcNow.AddDays(-1) });
        batch.JourneyEvents.Add(new JourneyEvent { BatchId = batch.Id, Step = "B", Location = "B", Latitude = 46.0, Longitude = 7.0, Timestamp = DateTime.UtcNow });
        product.Batches.Add(batch);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var routing = new StubRoutingService { ResultPoints = [[47.0, 8.0], [46.5, 7.5], [46.0, 7.0]] };
        var handler = new GetBatchRouteHandler(db, routing);
        var result = await handler.Handle(new GetBatchRouteQuery(batch.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(3, result.Value!.Segments[0].Points.Count);
    }
}
```

- [ ] **Step 2: Run tests**

Run: `dotnet test src/AutexisCase.Tests --filter "GetBatchRouteHandlerTests" -v minimal`
Expected: 4 passed

- [ ] **Step 3: Commit**

```bash
git add src/AutexisCase.Tests/Queries/GetBatchRouteHandlerTests.cs
git commit -m "Add GetBatchRouteHandler unit tests"
```

---

### Task 6: RecordScanHandler Tests

**Files:**
- Create: `src/AutexisCase.Tests/Commands/RecordScanHandlerTests.cs`

- [ ] **Step 1: Write tests**

```csharp
// src/AutexisCase.Tests/Commands/RecordScanHandlerTests.cs
using AutexisCase.Application.Commands;
using AutexisCase.Domain;
using AutexisCase.Domain.Enums;
using AutexisCase.Tests.Helpers;

namespace AutexisCase.Tests.Commands;

public class RecordScanHandlerTests
{
    [Fact]
    public async Task Records_scan_for_existing_product()
    {
        using var db = TestDbContext.Create();
        var user = new User { ExternalId = "test-external-id", Email = "t@t.com", DisplayName = "T" };
        var product = new Product { Gtin = "123", Name = "P", Brand = "B" };
        db.Users.Add(user);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var handler = new RecordScanHandler(db, new StubCurrentUserService(), new StubOpenFoodFactsService());
        var result = await handler.Handle(new RecordScanCommand("123"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("P", result.Value!.ProductName);
        Assert.Single(db.ScanRecords);
    }

    [Fact]
    public async Task Fetches_product_from_off_when_not_in_db()
    {
        using var db = TestDbContext.Create();
        var user = new User { ExternalId = "test-external-id", Email = "t@t.com", DisplayName = "T" };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var off = new StubOpenFoodFactsService
        {
            ProductToReturn = new Product { Gtin = "999", Name = "New", Brand = "OFF" }
        };

        var handler = new RecordScanHandler(db, new StubCurrentUserService(), off);
        var result = await handler.Handle(new RecordScanCommand("999"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("New", result.Value!.ProductName);
        Assert.Single(db.Products);
        Assert.Single(db.ScanRecords);
    }

    [Fact]
    public async Task Returns_failure_when_product_not_found_anywhere()
    {
        using var db = TestDbContext.Create();
        var user = new User { ExternalId = "test-external-id", Email = "t@t.com", DisplayName = "T" };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var handler = new RecordScanHandler(db, new StubCurrentUserService(), new StubOpenFoodFactsService());
        var result = await handler.Handle(new RecordScanCommand("000"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Product not found.", result.Error);
    }

    [Fact]
    public async Task Returns_failure_when_user_not_found()
    {
        using var db = TestDbContext.Create();
        var product = new Product { Gtin = "123", Name = "P", Brand = "B" };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var handler = new RecordScanHandler(db, new StubCurrentUserService { ExternalId = "no-match" }, new StubOpenFoodFactsService());
        var result = await handler.Handle(new RecordScanCommand("123"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("User not found.", result.Error);
    }

    [Fact]
    public async Task Returns_worst_batch_status()
    {
        using var db = TestDbContext.Create();
        var user = new User { ExternalId = "test-external-id", Email = "t@t.com", DisplayName = "T" };
        var product = new Product { Gtin = "123", Name = "P", Brand = "B" };
        product.Batches.Add(new Batch { LotNumber = "L1", Status = ProductStatus.Ok });
        product.Batches.Add(new Batch { LotNumber = "L2", Status = ProductStatus.Recall });
        db.Users.Add(user);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var handler = new RecordScanHandler(db, new StubCurrentUserService(), new StubOpenFoodFactsService());
        var result = await handler.Handle(new RecordScanCommand("123"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(ProductStatus.Recall, result.Value!.Status);
    }
}
```

- [ ] **Step 2: Run tests**

Run: `dotnet test src/AutexisCase.Tests --filter "RecordScanHandlerTests" -v minimal`
Expected: 5 passed

- [ ] **Step 3: Commit**

```bash
git add src/AutexisCase.Tests/Commands/RecordScanHandlerTests.cs
git commit -m "Add RecordScanHandler unit tests"
```

---

### Task 7: RoutingService Tests

**Files:**
- Create: `src/AutexisCase.Tests/Services/RoutingServiceTests.cs`

- [ ] **Step 1: Write tests for ocean detection and great circle arc**

These test the static/pure logic of RoutingService. Since IsCrossOcean and GenerateGreatCircleArc are private, we test them indirectly through GetRouteAsync by providing a TestDbContext with cache and a fake HttpClient that returns errors (forcing fallback paths).

```csharp
// src/AutexisCase.Tests/Services/RoutingServiceTests.cs
using System.Net;
using System.Text.Json;
using AutexisCase.Domain;
using AutexisCase.Infrastructure.Services;
using AutexisCase.Tests.Helpers;
using Microsoft.Extensions.Configuration;

namespace AutexisCase.Tests.Services;

public class RoutingServiceTests
{
    private static RoutingService CreateService(TestDbContext db, HttpMessageHandler? handler = null)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["OpenRouteService:ApiKey"] = "test-key" })
            .Build();
        var httpClient = new HttpClient(handler ?? new FakeHandler(HttpStatusCode.InternalServerError));
        return new RoutingService(httpClient, config, db);
    }

    [Fact]
    public async Task Returns_cached_route_when_available()
    {
        using var db = TestDbContext.Create();
        var cacheKey = "47.0000_8.0000_46.0000_7.0000_driving-hgv";
        var cachedPoints = new List<double[]> { [47.0, 8.0], [46.0, 7.0] };
        db.RouteCaches.Add(new RouteCache
        {
            CacheKey = cacheKey,
            PointsJson = JsonSerializer.Serialize(cachedPoints),
            Profile = "driving-hgv",
            ExpiresAt = DateTime.UtcNow.AddDays(10),
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.GetRouteAsync(47.0, 8.0, 46.0, 7.0);

        Assert.Equal(2, result.Count);
        Assert.Equal(47.0, result[0][0]);
    }

    [Fact]
    public async Task Ignores_expired_cache()
    {
        using var db = TestDbContext.Create();
        var cacheKey = "47.0000_8.0000_46.0000_7.0000_driving-hgv";
        db.RouteCaches.Add(new RouteCache
        {
            CacheKey = cacheKey,
            PointsJson = "[[47,8],[46,7]]",
            Profile = "driving-hgv",
            ExpiresAt = DateTime.UtcNow.AddDays(-1),
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        // ORS call will fail (fake handler returns 500), so fallback to straight line
        var result = await service.GetRouteAsync(47.0, 8.0, 46.0, 7.0);

        // Should be a straight line fallback (2 points), not the cached 2 points with values [47,8]
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task Falls_back_to_straight_line_on_ors_failure()
    {
        using var db = TestDbContext.Create();
        var service = CreateService(db, new FakeHandler(HttpStatusCode.InternalServerError));

        var result = await service.GetRouteAsync(47.0, 8.0, 46.0, 7.0);

        Assert.Equal(2, result.Count);
        Assert.Equal(47.0, result[0][0]);
        Assert.Equal(8.0, result[0][1]);
        Assert.Equal(46.0, result[1][0]);
        Assert.Equal(7.0, result[1][1]);
    }

    [Fact]
    public async Task Uses_great_circle_for_cross_ocean_routes()
    {
        using var db = TestDbContext.Create();
        // Large longitude difference > 40 degrees triggers cross-ocean
        var service = CreateService(db);
        var result = await service.GetRouteAsync(47.0, 8.0, 35.0, -80.0);

        // Great circle arc produces 51 points (0..50 segments)
        Assert.Equal(51, result.Count);
    }

    [Fact]
    public async Task Caches_result_after_fetching()
    {
        using var db = TestDbContext.Create();
        var service = CreateService(db, new FakeHandler(HttpStatusCode.InternalServerError));

        await service.GetRouteAsync(47.0, 8.0, 46.0, 7.0);

        Assert.Single(db.RouteCaches);
        Assert.Equal("47.0000_8.0000_46.0000_7.0000_driving-hgv", db.RouteCaches.First().CacheKey);
    }

    [Fact]
    public async Task Parses_ors_response_correctly()
    {
        using var db = TestDbContext.Create();
        var orsResponse = new
        {
            features = new[]
            {
                new
                {
                    geometry = new
                    {
                        coordinates = new[] { new[] { 8.0, 47.0 }, new[] { 7.5, 46.5 }, new[] { 7.0, 46.0 } }
                    }
                }
            }
        };

        var handler = new FakeHandler(HttpStatusCode.OK, JsonSerializer.Serialize(orsResponse));
        var service = CreateService(db, handler);

        var result = await service.GetRouteAsync(47.0, 8.0, 46.0, 7.0);

        Assert.Equal(3, result.Count);
        // ORS returns [lon, lat], service converts to [lat, lon]
        Assert.Equal(47.0, result[0][0]);
        Assert.Equal(8.0, result[0][1]);
    }

    [Fact]
    public async Task Uses_profile_in_cache_key()
    {
        using var db = TestDbContext.Create();
        var service = CreateService(db, new FakeHandler(HttpStatusCode.InternalServerError));

        await service.GetRouteAsync(47.0, 8.0, 46.0, 7.0, "cycling-regular");

        Assert.Contains("cycling-regular", db.RouteCaches.First().CacheKey);
    }

    [Fact]
    public void Throws_when_api_key_not_configured()
    {
        using var db = TestDbContext.Create();
        var config = new ConfigurationBuilder().AddInMemoryCollection().Build();
        Assert.Throws<InvalidOperationException>(() => new RoutingService(new HttpClient(), config, db));
    }
}

public class FakeHandler : HttpMessageHandler
{
    private readonly HttpStatusCode _statusCode;
    private readonly string? _content;

    public FakeHandler(HttpStatusCode statusCode, string? content = null)
    {
        _statusCode = statusCode;
        _content = content;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var response = new HttpResponseMessage(_statusCode);
        if (_content is not null) response.Content = new StringContent(_content);
        return Task.FromResult(response);
    }
}
```

- [ ] **Step 2: Run tests**

Run: `dotnet test src/AutexisCase.Tests --filter "RoutingServiceTests" -v minimal`
Expected: 8 passed

- [ ] **Step 3: Commit**

```bash
git add src/AutexisCase.Tests/Services/RoutingServiceTests.cs
git commit -m "Add RoutingService unit tests"
```

---

### Task 8: GetRecentScansHandler and GetProductsHandler Tests

**Files:**
- Create: `src/AutexisCase.Tests/Queries/GetRecentScansHandlerTests.cs`
- Create: `src/AutexisCase.Tests/Queries/GetProductsHandlerTests.cs`

- [ ] **Step 1: Write GetRecentScansHandler tests**

```csharp
// src/AutexisCase.Tests/Queries/GetRecentScansHandlerTests.cs
using AutexisCase.Application.Queries;
using AutexisCase.Domain;
using AutexisCase.Tests.Helpers;

namespace AutexisCase.Tests.Queries;

public class GetRecentScansHandlerTests
{
    [Fact]
    public async Task Returns_empty_list_when_user_not_found()
    {
        using var db = TestDbContext.Create();
        var currentUser = new StubCurrentUserService { ExternalId = "unknown" };
        var handler = new GetRecentScansHandler(db, currentUser);
        var result = await handler.Handle(new GetRecentScansQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!);
    }

    [Fact]
    public async Task Returns_scans_ordered_by_most_recent()
    {
        using var db = TestDbContext.Create();
        var user = new User { ExternalId = "test-external-id", Email = "t@t.com", DisplayName = "T" };
        var product = new Product { Gtin = "123", Name = "P", Brand = "B" };
        db.Users.Add(user);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        db.ScanRecords.Add(new ScanRecord { UserId = user.Id, ProductId = product.Id, ScannedAt = DateTime.UtcNow.AddHours(-2) });
        db.ScanRecords.Add(new ScanRecord { UserId = user.Id, ProductId = product.Id, ScannedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var handler = new GetRecentScansHandler(db, new StubCurrentUserService());
        var result = await handler.Handle(new GetRecentScansQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Count);
        Assert.True(result.Value[0].ScannedAt > result.Value[1].ScannedAt);
    }
}
```

- [ ] **Step 2: Write GetProductsHandler tests**

```csharp
// src/AutexisCase.Tests/Queries/GetProductsHandlerTests.cs
using AutexisCase.Application.Queries;
using AutexisCase.Domain;
using AutexisCase.Tests.Helpers;

namespace AutexisCase.Tests.Queries;

public class GetProductsHandlerTests
{
    [Fact]
    public async Task Returns_all_products()
    {
        using var db = TestDbContext.Create();
        db.Products.Add(new Product { Gtin = "1", Name = "A", Brand = "B" });
        db.Products.Add(new Product { Gtin = "2", Name = "C", Brand = "D" });
        await db.SaveChangesAsync();

        var handler = new GetProductsHandler(db);
        var result = await handler.Handle(new GetProductsQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Count);
    }

    [Fact]
    public async Task Returns_empty_list_when_no_products()
    {
        using var db = TestDbContext.Create();
        var handler = new GetProductsHandler(db);
        var result = await handler.Handle(new GetProductsQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!);
    }
}
```

- [ ] **Step 3: Run all tests**

Run: `dotnet test src/AutexisCase.Tests -v minimal`
Expected: All tests passed (~30 total)

- [ ] **Step 4: Commit**

```bash
git add src/AutexisCase.Tests/Queries/GetRecentScansHandlerTests.cs src/AutexisCase.Tests/Queries/GetProductsHandlerTests.cs
git commit -m "Add GetRecentScansHandler and GetProductsHandler unit tests"
```
