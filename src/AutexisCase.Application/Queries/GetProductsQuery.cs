using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Mappers;
using AutexisCase.Application.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetProductsQuery : IQuery<Result<List<ProductSummaryDto>>>;

public class GetProductsHandler(IAppDbContext dbContext) : IQueryHandler<GetProductsQuery, Result<List<ProductSummaryDto>>>
{
    public async ValueTask<Result<List<ProductSummaryDto>>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var products = await dbContext.Products.AsNoTracking().OrderByDescending(p => p.CreatedAt).Select(p => p.ToSummaryDto()).ToListAsync(cancellationToken);
        return Result.Success(products);
    }
}
