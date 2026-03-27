using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Mappers;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetProductByGtinQuery(string Gtin) : IQuery<ProductDto?>;

public class GetProductByGtinHandler(IAppDbContext dbContext, IOpenFoodFactsService openFoodFacts) : IQueryHandler<GetProductByGtinQuery, ProductDto?>
{
    public async ValueTask<ProductDto?> Handle(GetProductByGtinQuery request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products
            .AsNoTracking()
            .Include(p => p.Batches)
            .SingleOrDefaultAsync(p => p.Gtin == request.Gtin, cancellationToken);

        if (product is not null) return product.ToDto();

        // Auto-fetch from Open Food Facts
        var fetched = await openFoodFacts.FetchProductAsync(request.Gtin, cancellationToken);
        if (fetched is null) return null;

        dbContext.Products.Add(fetched);
        await dbContext.SaveChangesAsync(cancellationToken);

        return fetched.ToDto();
    }
}
