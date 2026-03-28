using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using AutexisCase.Domain.Enums;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetAllProductsWithStatusQuery : IQuery<Result<List<AdminProductDto>>>;

public class GetAllProductsWithStatusHandler(IAppDbContext dbContext) : IQueryHandler<GetAllProductsWithStatusQuery, Result<List<AdminProductDto>>>
{
    public async ValueTask<Result<List<AdminProductDto>>> Handle(GetAllProductsWithStatusQuery request, CancellationToken cancellationToken)
    {
        var products = await dbContext.Products.AsNoTracking()
            .Include(p => p.Batches)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = products.Select(p =>
        {
            var worstStatus = p.Batches.Count > 0 ? p.Batches.Max(b => b.Status) : ProductStatus.Ok;
            return new AdminProductDto(p.Id, p.Name, p.Brand, p.ImageUrl, worstStatus);
        }).ToList();

        return Result.Success(result);
    }
}
