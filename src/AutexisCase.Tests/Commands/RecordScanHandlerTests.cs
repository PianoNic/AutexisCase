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

        var handler = new RecordScanHandler(db, new StubCurrentUserService());
        var result = await handler.Handle(new RecordScanCommand("123"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("P", result.Value!.ProductName);
        Assert.Single(db.ScanRecords);
    }

    [Fact]
    public async Task Returns_failure_when_product_not_in_db()
    {
        using var db = TestDbContext.Create();
        var user = new User { ExternalId = "test-external-id", Email = "t@t.com", DisplayName = "T" };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var handler = new RecordScanHandler(db, new StubCurrentUserService());
        var result = await handler.Handle(new RecordScanCommand("999"), CancellationToken.None);

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

        var handler = new RecordScanHandler(db, new StubCurrentUserService { ExternalId = "no-match" });
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

        var handler = new RecordScanHandler(db, new StubCurrentUserService());
        var result = await handler.Handle(new RecordScanCommand("123"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(ProductStatus.Recall, result.Value!.ProductStatus);
    }
}
