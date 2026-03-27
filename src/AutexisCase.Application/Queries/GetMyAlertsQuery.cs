using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetMyAlertsQuery : IQuery<Result<List<AlertDto>>>;

public class GetMyAlertsHandler(IAppDbContext dbContext, ICurrentUserService currentUserService) : IQueryHandler<GetMyAlertsQuery, Result<List<AlertDto>>>
{
    public async ValueTask<Result<List<AlertDto>>> Handle(GetMyAlertsQuery request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalId == currentUserService.ExternalId, cancellationToken);
        if (user is null) return Result.Success(new List<AlertDto>());

        var scannedProductIds = await dbContext.ScanRecords.AsNoTracking().Where(s => s.UserId == user.Id).Select(s => s.ProductId).Distinct().ToListAsync(cancellationToken);
        var alerts = await dbContext.Alerts.AsNoTracking().Where(a => scannedProductIds.Contains(a.Batch.ProductId)).OrderByDescending(a => a.Timestamp).Select(a => new AlertDto(a.Id, a.Type, a.Severity, a.Title, a.Description, a.Timestamp, a.Read)).ToListAsync(cancellationToken);
        return Result.Success(alerts);
    }
}
