using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using Mediator;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetPointToPointRouteQuery(double FromLat, double FromLon, double ToLat, double ToLon, string Profile = "driving-hgv") : IQuery<Result<PointToPointRouteDto>>;

public class GetPointToPointRouteHandler(IRoutingService routingService) : IQueryHandler<GetPointToPointRouteQuery, Result<PointToPointRouteDto>>
{
    public async ValueTask<Result<PointToPointRouteDto>> Handle(GetPointToPointRouteQuery request, CancellationToken cancellationToken)
    {
        var points = await routingService.GetRouteAsync(request.FromLat, request.FromLon, request.ToLat, request.ToLon, request.Profile, cancellationToken);
        return Result.Success(new PointToPointRouteDto(points));
    }
}
