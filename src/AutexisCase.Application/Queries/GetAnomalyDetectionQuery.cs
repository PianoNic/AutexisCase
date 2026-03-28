using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using AutexisCase.Domain.Enums;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetAnomalyDetectionQuery(Guid BatchId) : IQuery<Result<AnomalyDetectionResultDto>>;

public class GetAnomalyDetectionHandler(IAppDbContext dbContext) : IQueryHandler<GetAnomalyDetectionQuery, Result<AnomalyDetectionResultDto>>
{
    public async ValueTask<Result<AnomalyDetectionResultDto>> Handle(GetAnomalyDetectionQuery request, CancellationToken cancellationToken)
    {
        var batch = await dbContext.Batches.AsNoTracking()
            .Include(b => b.Alerts)
            .Include(b => b.TemperatureLogs.OrderBy(t => t.Time))
            .SingleOrDefaultAsync(b => b.Id == request.BatchId, cancellationToken);

        if (batch is null) return Result.Failure<AnomalyDetectionResultDto>("Batch not found.");

        var anomalies = new List<ColdChainAnomalyDto>();

        // Detect temperature spikes
        var temps = batch.TemperatureLogs.ToList();
        for (var i = 1; i < temps.Count; i++)
        {
            if (temps[i].Temperature > 22)
            {
                var duration = i + 1 < temps.Count
                    ? (temps[i + 1 < temps.Count ? i + 1 : i].Time - temps[i].Time).TotalHours
                    : 2;
                anomalies.Add(new ColdChainAnomalyDto(
                    Guid.NewGuid().ToString(), "warning", "spike",
                    $"Temperaturspitze bei {temps[i].Location}",
                    $"Temperatur stieg auf {temps[i].Temperature}°C bei {temps[i].Location}.",
                    temps[i - 1].Temperature, temps[i].Temperature,
                    $"{duration:F0}h", (int)(temps[i].Temperature > 25 ? 15 : 8)
                ));
            }
        }

        // Add alert-based anomalies
        foreach (var alert in batch.Alerts.Where(a => a.Type == AlertType.ColdChain))
        {
            if (!anomalies.Any(a => a.Title.Contains(alert.Title)))
            {
                anomalies.Add(new ColdChainAnomalyDto(
                    alert.Id.ToString(),
                    alert.Severity == AlertSeverity.Critical ? "critical" : "warning",
                    "sustained",
                    alert.Title, alert.Description ?? "",
                    16, 24, "3h", 12
                ));
            }
        }

        var chainIntegrity = anomalies.Count == 0 ? 100 : Math.Max(0, 100 - anomalies.Count * 15);
        var overallRisk = chainIntegrity > 85 ? "low" : chainIntegrity > 60 ? "medium" : "high";

        return Result.Success(new AnomalyDetectionResultDto(anomalies, overallRisk, chainIntegrity));
    }
}
