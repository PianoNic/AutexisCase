using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Mappers;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetProductsQuery : IQuery<List<ProductSummaryDto>>;

public class GetProductsHandler(IAppDbContext dbContext) : IQueryHandler<GetProductsQuery, List<ProductSummaryDto>>
{
    public async ValueTask<List<ProductSummaryDto>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.Products
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => p.ToSummaryDto())
            .ToListAsync(cancellationToken);
    }
}
