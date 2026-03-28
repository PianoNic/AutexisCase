using AutexisCase.Application.Queries;
using AutexisCase.Domain;
using AutexisCase.Tests.Helpers;

namespace AutexisCase.Tests.Queries;

public class GetBatchBlockchainHandlerTests
{
    [Fact]
    public async Task Returns_blockchain_with_linked_hashes()
    {
        using var db = TestDbContext.Create();
        var product = new Product { Gtin = "123", Name = "P", Brand = "B" };
        var batch = new Batch { LotNumber = "L1", ProductId = product.Id };
        batch.JourneyEvents.Add(new JourneyEvent { BatchId = batch.Id, Step = "Farm", Location = "A", Latitude = 47.0, Longitude = 8.0, Timestamp = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) });
        batch.JourneyEvents.Add(new JourneyEvent { BatchId = batch.Id, Step = "Factory", Location = "B", Latitude = 46.5, Longitude = 7.5, Timestamp = new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc) });
        batch.JourneyEvents.Add(new JourneyEvent { BatchId = batch.Id, Step = "Store", Location = "C", Latitude = 46.0, Longitude = 7.0, Timestamp = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc) });
        product.Batches.Add(batch);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var handler = new GetBatchBlockchainHandler(db);
        var result = await handler.Handle(new GetBatchBlockchainQuery(batch.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(3, result.Value!.Blocks.Count);
        Assert.True(result.Value.ChainValid);
        Assert.Equal("123", result.Value.Gtin);
        Assert.Equal("L1", result.Value.LotNumber);
    }

    [Fact]
    public async Task First_block_has_genesis_previous_hash()
    {
        using var db = TestDbContext.Create();
        var product = new Product { Gtin = "123", Name = "P", Brand = "B" };
        var batch = new Batch { LotNumber = "L1", ProductId = product.Id };
        batch.JourneyEvents.Add(new JourneyEvent { BatchId = batch.Id, Step = "Farm", Location = "A", Latitude = 47.0, Longitude = 8.0, Timestamp = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) });
        product.Batches.Add(batch);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var handler = new GetBatchBlockchainHandler(db);
        var result = await handler.Handle(new GetBatchBlockchainQuery(batch.Id), CancellationToken.None);

        var genesis = "0000000000000000000000000000000000000000000000000000000000000000";
        Assert.Equal(genesis, result.Value!.Blocks[0].PreviousHash);
    }

    [Fact]
    public async Task Each_block_links_to_previous()
    {
        using var db = TestDbContext.Create();
        var product = new Product { Gtin = "123", Name = "P", Brand = "B" };
        var batch = new Batch { LotNumber = "L1", ProductId = product.Id };
        batch.JourneyEvents.Add(new JourneyEvent { BatchId = batch.Id, Step = "A", Location = "A", Latitude = 47.0, Longitude = 8.0, Timestamp = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) });
        batch.JourneyEvents.Add(new JourneyEvent { BatchId = batch.Id, Step = "B", Location = "B", Latitude = 46.0, Longitude = 7.0, Timestamp = new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc) });
        product.Batches.Add(batch);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var handler = new GetBatchBlockchainHandler(db);
        var result = await handler.Handle(new GetBatchBlockchainQuery(batch.Id), CancellationToken.None);

        Assert.Equal(result.Value!.Blocks[0].Hash, result.Value.Blocks[1].PreviousHash);
    }

    [Fact]
    public async Task Hashes_are_deterministic()
    {
        using var db = TestDbContext.Create();
        var product = new Product { Gtin = "123", Name = "P", Brand = "B" };
        var batch = new Batch { LotNumber = "L1", ProductId = product.Id };
        batch.JourneyEvents.Add(new JourneyEvent { BatchId = batch.Id, Step = "Farm", Location = "A", Latitude = 47.0, Longitude = 8.0, Timestamp = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) });
        product.Batches.Add(batch);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var handler = new GetBatchBlockchainHandler(db);
        var result1 = await handler.Handle(new GetBatchBlockchainQuery(batch.Id), CancellationToken.None);
        var result2 = await handler.Handle(new GetBatchBlockchainQuery(batch.Id), CancellationToken.None);

        Assert.Equal(result1.Value!.Blocks[0].Hash, result2.Value!.Blocks[0].Hash);
    }

    [Fact]
    public async Task Returns_failure_when_batch_not_found()
    {
        using var db = TestDbContext.Create();
        var handler = new GetBatchBlockchainHandler(db);
        var result = await handler.Handle(new GetBatchBlockchainQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsFailure);
    }
}
