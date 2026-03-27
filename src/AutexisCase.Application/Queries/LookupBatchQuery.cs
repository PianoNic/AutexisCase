using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Mappers;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record LookupBatchQuery(string Gtin, string Lot) : IQuery<BatchDto?>;

public class LookupBatchHandler(IAppDbContext dbContext) : IQueryHandler<LookupBatchQuery, BatchDto?>
{
    public async ValueTask<BatchDto?> Handle(LookupBatchQuery request, CancellationToken cancellationToken)
    {
        var batch = await dbContext.Batches
            .AsNoTracking()
            .Include(b => b.Product)
            .Include(b => b.JourneyEvents.OrderBy(j => j.Timestamp))
            .Include(b => b.PriceBreakdown)
            .Include(b => b.TemperatureLogs.OrderBy(t => t.Time))
            .Include(b => b.Alerts)
            .SingleOrDefaultAsync(b => b.Product.Gtin == request.Gtin && b.LotNumber == request.Lot, cancellationToken);

        return batch?.ToDto();
    }
}
