using AutexisCase.Domain;

namespace AutexisCase.Application.Interfaces;

public interface IOpenFoodFactsService
{
    Task<Product?> FetchProductAsync(string gtin, CancellationToken cancellationToken = default);
}
