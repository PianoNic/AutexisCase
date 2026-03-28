using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetProductAlternativesQuery(Guid ProductId) : IQuery<Result<ProductAlternativesDto>>;

public class GetProductAlternativesHandler(IAppDbContext dbContext) : IQueryHandler<GetProductAlternativesQuery, Result<ProductAlternativesDto>>
{
    public async ValueTask<Result<ProductAlternativesDto>> Handle(GetProductAlternativesQuery request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products.AsNoTracking()
            .Include(p => p.Batches)
            .SingleOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

        if (product is null) return Result.Failure<ProductAlternativesDto>("Product not found.");

        var alternatives = await dbContext.Products.AsNoTracking()
            .Where(p => p.Id != request.ProductId && p.Category == product.Category)
            .Take(3)
            .Include(p => p.Batches)
            .ToListAsync(cancellationToken);

        // If no same-category products, just return other products
        if (alternatives.Count == 0)
        {
            alternatives = await dbContext.Products.AsNoTracking()
                .Where(p => p.Id != request.ProductId)
                .Take(3)
                .Include(p => p.Batches)
                .ToListAsync(cancellationToken);
        }

        var result = alternatives.Select(p =>
        {
            var co2 = p.Batches.FirstOrDefault()?.Co2Kg ?? 0;
            var tags = new List<string>();
            if (p.NutriScore != null && product.NutriScore != null && string.Compare(p.NutriScore, product.NutriScore) < 0)
                tags.Add($"Besserer Nutri-Score ({p.NutriScore})");
            if (co2 < (product.Batches.FirstOrDefault()?.Co2Kg ?? 99))
                tags.Add("Weniger CO₂");
            if (p.Certifications.Count > product.Certifications.Count)
                tags.Add("Mehr Zertifizierungen");
            if (tags.Count == 0) tags.Add("Gleiche Kategorie");

            return new AlternativeProductDto(p.Id, p.Name, p.Brand, p.ImageUrl, p.NutriScore, co2, tags);
        }).ToList();

        return Result.Success(new ProductAlternativesDto(result));
    }
}
