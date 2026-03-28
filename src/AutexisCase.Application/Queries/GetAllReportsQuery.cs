using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetAllReportsQuery : IQuery<Result<List<ProductReportDto>>>;

public class GetAllReportsHandler(IAppDbContext dbContext) : IQueryHandler<GetAllReportsQuery, Result<List<ProductReportDto>>>
{
    public async ValueTask<Result<List<ProductReportDto>>> Handle(GetAllReportsQuery request, CancellationToken cancellationToken)
    {
        var reports = await dbContext.ProductReports.AsNoTracking()
            .Include(r => r.Product)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ProductReportDto(
                r.Id, r.ProductId, r.Product.Name, r.Product.Brand, r.Product.ImageUrl,
                r.BatchId, r.Reason, r.Details, r.Resolved, r.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return Result.Success(reports);
    }
}
