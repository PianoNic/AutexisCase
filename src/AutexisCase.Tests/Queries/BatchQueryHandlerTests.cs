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
