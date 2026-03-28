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
