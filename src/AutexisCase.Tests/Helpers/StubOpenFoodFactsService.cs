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
