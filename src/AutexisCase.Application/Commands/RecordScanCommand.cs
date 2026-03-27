using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using AutexisCase.Domain;
using AutexisCase.Domain.Enums;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Commands;

[AllowAuthenticated]
public record RecordScanCommand(string Gtin) : ICommand<Result<ScanRecordDto>>;

public class RecordScanHandler(IAppDbContext dbContext, ICurrentUserService currentUserService, IOpenFoodFactsService openFoodFacts) : ICommandHandler<RecordScanCommand, Result<ScanRecordDto>>
{
    public async ValueTask<Result<ScanRecordDto>> Handle(RecordScanCommand request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products.Include(p => p.Batches).FirstOrDefaultAsync(p => p.Gtin == request.Gtin, cancellationToken);

        if (product is null)
        {
            product = await openFoodFacts.FetchProductAsync(request.Gtin, cancellationToken);
            if (product is null) return Result.Failure<ScanRecordDto>("Product not found.");
            dbContext.Products.Add(product);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalId == currentUserService.ExternalId, cancellationToken);
        if (user is null) return Result.Failure<ScanRecordDto>("User not found.");

        var scan = new ScanRecord { UserId = user.Id, ProductId = product.Id, ScannedAt = DateTime.UtcNow };
        dbContext.ScanRecords.Add(scan);
        await dbContext.SaveChangesAsync(cancellationToken);

        var worstStatus = product.Batches.Count > 0 ? product.Batches.Max(b => b.Status) : ProductStatus.Ok;
        return Result.Success(new ScanRecordDto(scan.Id, product.Id, product.Name, product.Brand, product.ImageUrl, worstStatus, scan.ScannedAt));
    }
}
