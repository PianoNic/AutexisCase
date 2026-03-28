using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetSustainabilityQuery(Guid BatchId) : IQuery<Result<SustainabilityAnalysisDto>>;

public class GetSustainabilityHandler(IAppDbContext dbContext) : IQueryHandler<GetSustainabilityQuery, Result<SustainabilityAnalysisDto>>
{
    public async ValueTask<Result<SustainabilityAnalysisDto>> Handle(GetSustainabilityQuery request, CancellationToken cancellationToken)
    {
        var batch = await dbContext.Batches.AsNoTracking()
            .Include(b => b.Product)
            .Include(b => b.JourneyEvents.OrderBy(j => j.Timestamp))
            .SingleOrDefaultAsync(b => b.Id == request.BatchId, cancellationToken);

        if (batch is null) return Result.Failure<SustainabilityAnalysisDto>("Batch not found.");

        var breakdown = batch.JourneyEvents
            .Where(j => j.Co2Kg.HasValue && j.Co2Kg > 0)
            .Select(j => new Co2BreakdownItemDto(
                j.Id.ToString(), j.Step, j.Co2Kg!.Value, 0
            )).ToList();

        var totalCo2 = breakdown.Sum(b => b.Co2Kg);
        if (totalCo2 > 0)
        {
            breakdown = breakdown.Select(b => b with { Percentage = (int)Math.Round(b.Co2Kg / totalCo2 * 100) }).ToList();
        }

        var totalWater = batch.WaterLiters ?? batch.JourneyEvents.Sum(j => j.WaterLiters ?? 0);

        // Estimate transport distance from journey coordinates
        var events = batch.JourneyEvents.ToList();
        var totalDistanceKm = 0;
        for (var i = 1; i < events.Count; i++)
        {
            totalDistanceKm += (int)HaversineKm(events[i - 1].Latitude, events[i - 1].Longitude, events[i].Latitude, events[i].Longitude);
        }

        // Average chocolate product is ~3.5kg CO2 per 100g
        var comparisonToAverage = totalCo2 > 0 ? (int)Math.Round(((double)totalCo2 / 3.5 - 1) * 100) : 0;

        var packagingScore = batch.Product.Certifications.Any(c => c.Contains("FSC")) ? "B" : "C";

        var tips = new List<string>();
        if (totalDistanceKm > 5000) tips.Add("Weite Transportwege erhöhen den CO₂-Fussabdruck.");
        if (batch.Product.Certifications.Any(c => c.Contains("Rainforest") || c.Contains("Fairtrade"))) tips.Add("Zertifizierte Rohstoffe unterstützen nachhaltigen Anbau.");
        if (comparisonToAverage < 0) tips.Add("Dieses Produkt liegt unter dem Branchendurchschnitt beim CO₂-Ausstoss.");
        if (comparisonToAverage >= 0) tips.Add("Regionale Alternativen können den CO₂-Fussabdruck reduzieren.");

        return Result.Success(new SustainabilityAnalysisDto(
            breakdown, totalCo2, comparisonToAverage, totalWater, totalDistanceKm, packagingScore, tips
        ));
    }

    private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}
