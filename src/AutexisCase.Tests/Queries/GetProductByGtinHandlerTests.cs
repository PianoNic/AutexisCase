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

        var handler = new GetProductByGtinHandler(db);
        var result = await handler.Handle(new GetProductByGtinQuery("7640150491001"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Existing", result.Value!.Name);
    }

    [Fact]
    public async Task Returns_failure_when_not_in_db()
    {
        using var db = TestDbContext.Create();

        var handler = new GetProductByGtinHandler(db);
        var result = await handler.Handle(new GetProductByGtinQuery("999"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Product not found.", result.Error);
    }

    [Fact]
    public async Task Returns_failure_when_gtin_does_not_match()
    {
        using var db = TestDbContext.Create();
        var product = new Product { Gtin = "1111", Name = "Other", Brand = "B" };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var handler = new GetProductByGtinHandler(db);
        var result = await handler.Handle(new GetProductByGtinQuery("000"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Product not found.", result.Error);
    }
}
