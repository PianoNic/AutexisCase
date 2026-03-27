using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Mappers;
using AutexisCase.Application.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetBatchByIdQuery(Guid BatchId) : IQuery<Result<BatchDto>>;

public class GetBatchByIdHandler(IAppDbContext dbContext) : IQueryHandler<GetBatchByIdQuery, Result<BatchDto>>
{
    public async ValueTask<Result<BatchDto>> Handle(GetBatchByIdQuery request, CancellationToken cancellationToken)
    {
        var batch = await dbContext.Batches.AsNoTracking().Include(b => b.Product).Include(b => b.JourneyEvents.OrderBy(j => j.Timestamp)).Include(b => b.PriceBreakdown).Include(b => b.TemperatureLogs.OrderBy(t => t.Time)).Include(b => b.Alerts).SingleOrDefaultAsync(b => b.Id == request.BatchId, cancellationToken);
        return batch is null ? Result.Failure<BatchDto>("Batch not found.") : Result.Success(batch.ToDto());
    }
}
