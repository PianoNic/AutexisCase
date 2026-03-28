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
