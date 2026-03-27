using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Mappers;
using AutexisCase.Application.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetProductByGtinQuery(string Gtin) : IQuery<Result<ProductDto>>;

public class GetProductByGtinHandler(IAppDbContext dbContext, IOpenFoodFactsService openFoodFacts) : IQueryHandler<GetProductByGtinQuery, Result<ProductDto>>
{
    public async ValueTask<Result<ProductDto>> Handle(GetProductByGtinQuery request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products.AsNoTracking().Include(p => p.Batches).SingleOrDefaultAsync(p => p.Gtin == request.Gtin, cancellationToken);
        if (product is not null) return Result.Success(product.ToDto());

        var fetched = await openFoodFacts.FetchProductAsync(request.Gtin, cancellationToken);
        if (fetched is null) return Result.Failure<ProductDto>("Product not found.");

        dbContext.Products.Add(fetched);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success(fetched.ToDto());
    }
}
