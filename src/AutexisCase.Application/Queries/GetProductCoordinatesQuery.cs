using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetProductCoordinatesQuery(Guid ProductId) : IQuery<JourneyCoordinatesDto>;

public class GetProductCoordinatesHandler(IAppDbContext dbContext) : IQueryHandler<GetProductCoordinatesQuery, JourneyCoordinatesDto>
{
    public async ValueTask<JourneyCoordinatesDto> Handle(GetProductCoordinatesQuery request, CancellationToken cancellationToken)
    {
        var coords = await dbContext.JourneyEvents
            .AsNoTracking()
            .Where(j => j.Batch.ProductId == request.ProductId)
            .OrderBy(j => j.Timestamp)
            .Select(j => new CoordinateDto(j.Step, j.Location, j.Latitude, j.Longitude, (int)j.Status))
            .ToListAsync(cancellationToken);

        return new JourneyCoordinatesDto(request.ProductId, coords);
    }
}
