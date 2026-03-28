using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using AutexisCase.Domain;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Commands;

[AllowAuthenticated]
public record CreateReportCommand(Guid ProductId, Guid? BatchId, string Reason, string? Details) : ICommand<Result<ProductReportDto>>;

public class CreateReportHandler(IAppDbContext dbContext, ICurrentUserService currentUserService) : ICommandHandler<CreateReportCommand, Result<ProductReportDto>>
{
    public async ValueTask<Result<ProductReportDto>> Handle(CreateReportCommand request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products.AsNoTracking().SingleOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);
        if (product is null) return Result.Failure<ProductReportDto>("Product not found.");

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalId == currentUserService.ExternalId, cancellationToken);
        if (user is null) return Result.Failure<ProductReportDto>("User not found.");

        var report = new ProductReport
        {
            ProductId = request.ProductId,
            BatchId = request.BatchId,
            UserId = user.Id,
            Reason = request.Reason,
            Details = request.Details,
            Resolved = false,
        };

        dbContext.ProductReports.Add(report);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(new ProductReportDto(
            report.Id, product.Id, product.Name, product.Brand, product.ImageUrl,
            report.BatchId, report.Reason, report.Details, report.Resolved, report.CreatedAt
        ));
    }
}
