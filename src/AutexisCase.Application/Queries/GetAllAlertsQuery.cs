using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetAllAlertsQuery : IQuery<Result<List<AlertDto>>>;

public class GetAllAlertsHandler(IAppDbContext dbContext) : IQueryHandler<GetAllAlertsQuery, Result<List<AlertDto>>>
{
    public async ValueTask<Result<List<AlertDto>>> Handle(GetAllAlertsQuery request, CancellationToken cancellationToken)
    {
        var alerts = await dbContext.Alerts.AsNoTracking()
            .OrderByDescending(a => a.Timestamp)
            .Select(a => new AlertDto(a.Id, a.Type, a.Severity, a.Title, a.Description, a.Timestamp, a.Read))
            .ToListAsync(cancellationToken);
        return Result.Success(alerts);
    }
}
