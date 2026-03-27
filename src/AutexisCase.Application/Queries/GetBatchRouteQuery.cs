using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetBatchRouteQuery(Guid BatchId) : IQuery<Result<RouteDto>>;

public class GetBatchRouteHandler(IAppDbContext dbContext, IRoutingService routingService) : IQueryHandler<GetBatchRouteQuery, Result<RouteDto>>
{
    public async ValueTask<Result<RouteDto>> Handle(GetBatchRouteQuery request, CancellationToken cancellationToken)
    {
        var events = await dbContext.JourneyEvents.AsNoTracking()
            .Where(j => j.BatchId == request.BatchId)
            .OrderBy(j => j.Timestamp)
            .Select(j => new { j.Step, j.Location, j.Latitude, j.Longitude })
            .ToListAsync(cancellationToken);

        if (events.Count < 2) return Result.Failure<RouteDto>("Not enough journey points for routing.");

        var segments = new List<RouteSegmentDto>();
        for (int i = 0; i < events.Count - 1; i++)
        {
            var from = events[i];
            var to = events[i + 1];
            var points = await routingService.GetRouteAsync(from.Latitude, from.Longitude, to.Latitude, to.Longitude, "driving-hgv", cancellationToken);
            segments.Add(new RouteSegmentDto(from.Step, to.Step, from.Location, to.Location, points));
        }

        return Result.Success(new RouteDto(segments));
    }
}
