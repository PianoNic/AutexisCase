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
