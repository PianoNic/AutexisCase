using System.Text;
using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Commands;

[AllowAuthenticated]
public record AskProductCommand(Guid ProductId, Guid? BatchId, string Question) : ICommand<Result<ChatResponseDto>>;

public class AskProductHandler(IAppDbContext dbContext, IChatService chatService) : ICommandHandler<AskProductCommand, Result<ChatResponseDto>>
{
    public async ValueTask<Result<ChatResponseDto>> Handle(AskProductCommand request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products.AsNoTracking()
            .Include(p => p.Batches)
            .SingleOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

        if (product is null) return Result.Failure<ChatResponseDto>("Product not found.");

        Domain.Batch? batch = null;
        if (request.BatchId.HasValue)
        {
            batch = await dbContext.Batches.AsNoTracking()
                .Include(b => b.JourneyEvents.OrderBy(j => j.Timestamp))
                .Include(b => b.TemperatureLogs.OrderBy(t => t.Time))
                .Include(b => b.Alerts)
                .SingleOrDefaultAsync(b => b.Id == request.BatchId.Value, cancellationToken);
        }

        var context = BuildContext(product, batch);
        var answer = await chatService.AskAsync(request.Question, context, cancellationToken);

        return Result.Success(new ChatResponseDto(answer));
    }

    private static string BuildContext(Domain.Product p, Domain.Batch? batch)
    {
        var sb = new StringBuilder();

        sb.AppendLine($"Produkt: {p.Name}");
        sb.AppendLine($"Marke: {p.Brand}");
        sb.AppendLine($"GTIN: {p.Gtin}");
        sb.AppendLine($"Kategorie: {p.Category}");
        sb.AppendLine($"Gewicht: {p.Weight}");
        sb.AppendLine($"Herkunft: {p.Origin}");
        sb.AppendLine($"Nutri-Score: {p.NutriScore}");
        sb.AppendLine($"Eco-Score: {p.EcoScore}");
        sb.AppendLine($"Zertifizierungen: {string.Join(", ", p.Certifications)}");

        sb.AppendLine($"\nNährwerte pro 100g:");
        sb.AppendLine($"  Energie: {p.Nutrition.EnergyKcal} kcal");
        sb.AppendLine($"  Fett: {p.Nutrition.Fat}g (davon gesättigt: {p.Nutrition.SaturatedFat}g)");
        sb.AppendLine($"  Kohlenhydrate: {p.Nutrition.Carbs}g (davon Zucker: {p.Nutrition.Sugars}g)");
        sb.AppendLine($"  Ballaststoffe: {p.Nutrition.Fiber}g");
        sb.AppendLine($"  Eiweiss: {p.Nutrition.Protein}g");
        sb.AppendLine($"  Salz: {p.Nutrition.Salt}g");

        if (batch is null) return sb.ToString();

        sb.AppendLine($"\nCharge: {batch.LotNumber}");
        sb.AppendLine($"Status: {batch.Status}");
        sb.AppendLine($"Risiko-Score: {batch.RiskScore}");
        sb.AppendLine($"CO₂: {batch.Co2Kg} kg");
        sb.AppendLine($"Wasser: {batch.WaterLiters} L");
        sb.AppendLine($"Produktion: {batch.ProductionDate:dd.MM.yyyy}");
        sb.AppendLine($"Ablaufdatum: {batch.ExpiryDate:dd.MM.yyyy}");
        sb.AppendLine($"Verbleibende Tage: {batch.DaysRemaining}");

        if (batch.JourneyEvents.Count > 0)
        {
            sb.AppendLine("\nLieferkette:");
            foreach (var e in batch.JourneyEvents)
                sb.AppendLine($"  {e.Timestamp:dd.MM.yyyy} | {e.Step} | {e.Location} | {e.Temperature}°C | {e.Details}");
        }

        if (batch.Alerts.Count > 0)
        {
            sb.AppendLine("\nWarnungen:");
            foreach (var a in batch.Alerts)
                sb.AppendLine($"  [{a.Severity}] {a.Title}: {a.Description}");
        }

        if (batch.TemperatureLogs.Count > 0)
        {
            sb.AppendLine("\nTemperaturverlauf:");
            foreach (var t in batch.TemperatureLogs)
                sb.AppendLine($"  {t.Time:dd.MM.yyyy HH:mm} | {t.Temperature}°C | {t.Location}");
        }

        return sb.ToString();
    }
}
