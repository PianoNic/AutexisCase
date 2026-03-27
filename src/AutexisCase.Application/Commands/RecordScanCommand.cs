using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Domain;
using AutexisCase.Domain.Enums;
using AutexisCase.Application.Interfaces;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Commands;

[AllowAuthenticated]
public record RecordScanCommand(string Gtin) : ICommand<ScanRecordDto?>;

public class RecordScanHandler(IAppDbContext dbContext, ICurrentUserService currentUserService, IOpenFoodFactsService openFoodFacts) : ICommandHandler<RecordScanCommand, ScanRecordDto?>
{
    public async ValueTask<ScanRecordDto?> Handle(RecordScanCommand request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products.Include(p => p.Batches).FirstOrDefaultAsync(p => p.Gtin == request.Gtin, cancellationToken);

        // Auto-fetch from Open Food Facts if not in DB
        if (product is null)
        {
            product = await openFoodFacts.FetchProductAsync(request.Gtin, cancellationToken);
            if (product is null) return null;
            dbContext.Products.Add(product);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalId == currentUserService.ExternalId, cancellationToken);
        if (user is null) return null;

        var scan = new ScanRecord { UserId = user.Id, ProductId = product.Id, ScannedAt = DateTime.UtcNow };
        dbContext.ScanRecords.Add(scan);
        await dbContext.SaveChangesAsync(cancellationToken);

        var worstStatus = product.Batches.Count > 0
            ? product.Batches.Max(b => b.Status)
            : ProductStatus.Ok;

        return new ScanRecordDto(scan.Id, product.Id, product.Name, product.Brand, product.ImageUrl, worstStatus, scan.ScannedAt);
    }
}
