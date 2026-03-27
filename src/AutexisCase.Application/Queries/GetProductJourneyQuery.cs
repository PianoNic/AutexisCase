using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetProductJourneyQuery(Guid ProductId) : IQuery<List<JourneyEventDto>>;

public class GetProductJourneyHandler(IAppDbContext dbContext) : IQueryHandler<GetProductJourneyQuery, List<JourneyEventDto>>
{
    public async ValueTask<List<JourneyEventDto>> Handle(GetProductJourneyQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.JourneyEvents
            .AsNoTracking()
            .Where(j => j.Batch.ProductId == request.ProductId)
            .OrderBy(j => j.Timestamp)
            .Select(j => new JourneyEventDto(j.Id, j.Step, j.Location, j.Latitude, j.Longitude, j.Timestamp, j.Status, j.Icon, j.Temperature, j.Details, j.Co2Kg, j.WaterLiters, j.Cost))
            .ToListAsync(cancellationToken);
    }
}
