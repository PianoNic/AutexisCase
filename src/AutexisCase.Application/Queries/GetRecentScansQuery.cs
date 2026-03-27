using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using AutexisCase.Domain.Enums;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetRecentScansQuery : IQuery<Result<List<ScanRecordDto>>>;

public class GetRecentScansHandler(IAppDbContext dbContext, ICurrentUserService currentUserService) : IQueryHandler<GetRecentScansQuery, Result<List<ScanRecordDto>>>
{
    public async ValueTask<Result<List<ScanRecordDto>>> Handle(GetRecentScansQuery request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalId == currentUserService.ExternalId, cancellationToken);
        if (user is null) return Result.Success(new List<ScanRecordDto>());

        var scans = await dbContext.ScanRecords.AsNoTracking().Where(s => s.UserId == user.Id).OrderByDescending(s => s.ScannedAt).Take(20).Include(s => s.Product).ThenInclude(p => p.Batches).ToListAsync(cancellationToken);
        return Result.Success(scans.Select(s =>
        {
            var worstStatus = s.Product.Batches.Count > 0 ? s.Product.Batches.Max(b => b.Status) : ProductStatus.Ok;
            return new ScanRecordDto(s.Id, s.ProductId, s.Product.Name, s.Product.Brand, s.Product.ImageUrl, worstStatus, s.ScannedAt);
        }).ToList());
    }
}
