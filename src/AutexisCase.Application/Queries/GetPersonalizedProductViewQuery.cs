using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetPersonalizedProductViewQuery(Guid ProductId, Guid? BatchId, string UserPrompt) : IQuery<Result<string>>;

public class GetPersonalizedProductViewHandler(
    IAppDbContext dbContext,
    IJourneyDescriptionService descriptionService
) : IQueryHandler<GetPersonalizedProductViewQuery, Result<string>>
{
    public async ValueTask<Result<string>> Handle(GetPersonalizedProductViewQuery request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products
            .AsNoTracking()
            .Include(p => p.Batches)
            .SingleOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

        if (product is null)
            return Result.Failure<string>("Product not found.");

        // Build context about the product
        var batch = request.BatchId.HasValue
            ? await dbContext.Batches.AsNoTracking()
                .Include(b => b.JourneyEvents)
                .Include(b => b.TemperatureLogs)
                .Include(b => b.Alerts)
                .SingleOrDefaultAsync(b => b.Id == request.BatchId, cancellationToken)
            : product.Batches.Count > 0
                ? await dbContext.Batches.AsNoTracking()
                    .Include(b => b.JourneyEvents)
                    .Include(b => b.TemperatureLogs)
                    .Include(b => b.Alerts)
                    .SingleOrDefaultAsync(b => b.Id == product.Batches.First().Id, cancellationToken)
                : null;

        var productContext = $"""
            Produkt: {product.Name}
            Marke: {product.Brand}
            Gewicht: {product.Weight ?? "unbekannt"}
            Herkunft: {product.Origin ?? "unbekannt"}
            Kategorie: {product.Category ?? "unbekannt"}
            Nutri-Score: {product.NutriScore ?? "unbekannt"}
            Zertifizierungen: {string.Join(", ", product.Certifications)}
            Nährwerte: {product.Nutrition?.EnergyKcal ?? 0} kcal, Fett {product.Nutrition?.Fat ?? 0}g, Zucker {product.Nutrition?.Sugars ?? 0}g, Eiweiss {product.Nutrition?.Protein ?? 0}g, Salz {product.Nutrition?.Salt ?? 0}g
            """;

        if (batch is not null)
        {
            productContext += $"""
                Charge: {batch.LotNumber}
                CO₂: {batch.Co2Kg?.ToString() ?? "unbekannt"} kg
                Wasser: {batch.WaterLiters?.ToString() ?? "unbekannt"} L
                Haltbarkeit: {batch.DaysRemaining?.ToString() ?? "unbekannt"} Tage verbleibend
                Stationen: {string.Join(" → ", batch.JourneyEvents.OrderBy(e => e.Timestamp).Select(e => $"{e.Step} ({e.Location})"))}
                Warnungen: {batch.Alerts.Count}
                """;
        }

        var description = await descriptionService.GeneratePersonalizedViewAsync(
            productContext, request.UserPrompt, cancellationToken);

        return Result.Success(description);
    }
}
