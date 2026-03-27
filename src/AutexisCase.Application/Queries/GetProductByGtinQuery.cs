using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Mappers;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetProductByGtinQuery(string Gtin) : IQuery<ProductDto?>;

public class GetProductByGtinHandler(IAppDbContext dbContext) : IQueryHandler<GetProductByGtinQuery, ProductDto?>
{
    public async ValueTask<ProductDto?> Handle(GetProductByGtinQuery request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products
            .AsNoTracking()
            .Include(p => p.JourneyEvents.OrderBy(j => j.Timestamp))
            .Include(p => p.PriceBreakdown)
            .Include(p => p.TemperatureLogs.OrderBy(t => t.Time))
            .Include(p => p.Alerts)
            .SingleOrDefaultAsync(p => p.Gtin == request.Gtin, cancellationToken);

        return product?.ToDto();
    }
}
