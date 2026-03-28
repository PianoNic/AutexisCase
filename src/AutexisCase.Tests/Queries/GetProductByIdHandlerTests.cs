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
