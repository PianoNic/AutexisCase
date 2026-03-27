using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

public record GetExamplesQuery : IQuery<List<ExampleDto>>;

public class GetExamplesHandler(IAppDbContext dbContext) : IQueryHandler<GetExamplesQuery, List<ExampleDto>>
{
    public async ValueTask<List<ExampleDto>> Handle(GetExamplesQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.Examples
            .AsNoTracking()
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new ExampleDto(e.Id, e.Title, e.Description, e.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}
