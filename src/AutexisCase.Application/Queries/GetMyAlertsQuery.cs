using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetMyAlertsQuery : IQuery<List<AlertDto>>;

public class GetMyAlertsHandler(IAppDbContext dbContext, ICurrentUserService currentUserService) : IQueryHandler<GetMyAlertsQuery, List<AlertDto>>
{
    public async ValueTask<List<AlertDto>> Handle(GetMyAlertsQuery request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalId == currentUserService.ExternalId, cancellationToken);
        if (user is null) return [];

        var scannedProductIds = await dbContext.ScanRecords
            .AsNoTracking()
            .Where(s => s.UserId == user.Id)
            .Select(s => s.ProductId)
            .Distinct()
            .ToListAsync(cancellationToken);

        return await dbContext.Alerts
            .AsNoTracking()
            .Where(a => scannedProductIds.Contains(a.Batch.ProductId))
            .OrderByDescending(a => a.Timestamp)
            .Select(a => new AlertDto(a.Id, a.Type, a.Severity, a.Title, a.Description, a.Timestamp, a.Read))
            .ToListAsync(cancellationToken);
    }
}
