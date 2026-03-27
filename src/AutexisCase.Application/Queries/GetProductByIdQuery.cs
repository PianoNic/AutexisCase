using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Mappers;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetProductByIdQuery(Guid Id) : IQuery<ProductDto?>;

public class GetProductByIdHandler(IAppDbContext dbContext) : IQueryHandler<GetProductByIdQuery, ProductDto?>
{
    public async ValueTask<ProductDto?> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products
            .AsNoTracking()
            .Include(p => p.Batches)
            .SingleOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        return product?.ToDto();
    }
}
