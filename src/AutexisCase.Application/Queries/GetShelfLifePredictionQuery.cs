using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using AutexisCase.Domain.Enums;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetShelfLifePredictionQuery(Guid BatchId) : IQuery<Result<ShelfLifePredictionDto>>;

public class GetShelfLifePredictionHandler(IAppDbContext dbContext) : IQueryHandler<GetShelfLifePredictionQuery, Result<ShelfLifePredictionDto>>
{
    public async ValueTask<Result<ShelfLifePredictionDto>> Handle(GetShelfLifePredictionQuery request, CancellationToken cancellationToken)
    {
        var batch = await dbContext.Batches.AsNoTracking()
            .Include(b => b.Alerts)
            .Include(b => b.TemperatureLogs)
            .SingleOrDefaultAsync(b => b.Id == request.BatchId, cancellationToken);

        if (batch is null) return Result.Failure<ShelfLifePredictionDto>("Batch not found.");

        var daysRemaining = batch.DaysRemaining ?? batch.ShelfLifeDays ?? 180;
        var totalDays = batch.ShelfLifeDays ?? 365;
        var hasWarnings = batch.Alerts.Any(a => a.Severity == AlertSeverity.Warning);
        var hasCritical = batch.Alerts.Any(a => a.Severity == AlertSeverity.Critical);
        var hasTempSpike = batch.TemperatureLogs.Any(t => t.Temperature > 22);

        var confidence = hasCritical ? 0.45 : hasWarnings || hasTempSpike ? 0.72 : 0.95;

        // Quality degradation curve
        var progression = new List<QualityDataPointDto>();
        for (var i = 0; i <= 4; i++)
        {
            var day = (int)(totalDays * i / 4.0);
            var quality = 100.0 * Math.Exp(-0.5 * Math.Pow((double)day / totalDays, 2) * (hasTempSpike ? 4 : 2));
            var label = i == 0 ? "Produktion" : i == 4 ? "MHD" : $"Tag {day}";
            progression.Add(new QualityDataPointDto(day, Math.Round(quality, 1), label));
        }

        // Risk factors from alerts and temp logs
        var riskFactors = new List<RiskFactorDto>();
        if (hasTempSpike)
            riskFactors.Add(new RiskFactorDto(Guid.NewGuid().ToString(), "Temperaturabweichung", "high", "Temperatur überschritt 22°C während des Transports."));
        if (hasWarnings)
            riskFactors.Add(new RiskFactorDto(Guid.NewGuid().ToString(), "Kühlkettenrisiko", "medium", "Kühlkettenwarnung wurde ausgelöst."));
        if (daysRemaining < 30)
            riskFactors.Add(new RiskFactorDto(Guid.NewGuid().ToString(), "Kurze Resthaltbarkeit", "high", $"Nur noch {daysRemaining} Tage bis zum MHD."));
        if (riskFactors.Count == 0)
            riskFactors.Add(new RiskFactorDto(Guid.NewGuid().ToString(), "Optimale Lagerung", "low", "Alle Parameter im Normalbereich."));

        var recommendation = confidence > 0.9
            ? "Produkt ist in einwandfreiem Zustand. Optimale Qualität bis zum MHD erwartet."
            : confidence > 0.6
                ? "Leichte Qualitätsminderung möglich. Baldiger Konsum empfohlen."
                : "Erhöhtes Risiko für Qualitätsverlust. Vor Konsum Produkt prüfen.";

        return Result.Success(new ShelfLifePredictionDto(daysRemaining, confidence, progression, riskFactors, recommendation));
    }
}
