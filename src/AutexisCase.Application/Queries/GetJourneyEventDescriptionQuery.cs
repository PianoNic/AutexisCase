using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetJourneyEventDescriptionQuery(Guid EventId) : IQuery<Result<string>>;

public class GetJourneyEventDescriptionHandler(
    IAppDbContext dbContext,
    IJourneyDescriptionService descriptionService
) : IQueryHandler<GetJourneyEventDescriptionQuery, Result<string>>
{
    public async ValueTask<Result<string>> Handle(GetJourneyEventDescriptionQuery request, CancellationToken cancellationToken)
    {
        var journeyEvent = await dbContext.JourneyEvents
            .Include(e => e.Batch)
            .ThenInclude(b => b.Product)
            .SingleOrDefaultAsync(e => e.Id == request.EventId, cancellationToken);

        if (journeyEvent is null)
            return Result.Failure<string>("Journey event not found.");

        // Return cached description if available
        if (!string.IsNullOrEmpty(journeyEvent.Details))
            return Result.Success(journeyEvent.Details);

        // Find previous step for context
        var previousEvent = await dbContext.JourneyEvents
            .Where(e => e.BatchId == journeyEvent.BatchId && e.Timestamp < journeyEvent.Timestamp)
            .OrderByDescending(e => e.Timestamp)
            .FirstOrDefaultAsync(cancellationToken);

        // Generate AI description
        var description = await descriptionService.GenerateDescriptionAsync(
            journeyEvent.Batch.Product.Name,
            journeyEvent.Step,
            journeyEvent.Location,
            journeyEvent.Temperature,
            previousEvent?.Step,
            cancellationToken
        );

        // Cache it in the Details field
        journeyEvent.Details = description;
        journeyEvent.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(description);
    }
}
