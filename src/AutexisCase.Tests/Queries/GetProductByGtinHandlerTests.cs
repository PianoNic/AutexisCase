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
