using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Mappers;
using AutexisCase.Application.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetProductByIdQuery(Guid Id) : IQuery<Result<ProductDto>>;

public class GetProductByIdHandler(IAppDbContext dbContext) : IQueryHandler<GetProductByIdQuery, Result<ProductDto>>
{
    public async ValueTask<Result<ProductDto>> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products.AsNoTracking().Include(p => p.Batches).SingleOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
        return product is null ? Result.Failure<ProductDto>("Product not found.") : Result.Success(product.ToDto());
    }
}
