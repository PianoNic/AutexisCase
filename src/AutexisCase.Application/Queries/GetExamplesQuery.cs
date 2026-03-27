using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetExamplesQuery : IQuery<Result<List<ExampleDto>>>;

public class GetExamplesHandler(IAppDbContext dbContext) : IQueryHandler<GetExamplesQuery, Result<List<ExampleDto>>>
{
    public async ValueTask<Result<List<ExampleDto>>> Handle(GetExamplesQuery request, CancellationToken cancellationToken)
    {
        var examples = await dbContext.Examples.AsNoTracking().OrderByDescending(e => e.CreatedAt).Select(e => new ExampleDto(e.Id, e.Title, e.Description, e.CreatedAt)).ToListAsync(cancellationToken);
        return Result.Success(examples);
    }
}
