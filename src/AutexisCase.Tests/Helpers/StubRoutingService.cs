using AutexisCase.Application.Interfaces;

namespace AutexisCase.Tests.Helpers;

public class StubRoutingService : IRoutingService
{
    public List<double[]> ResultPoints { get; set; } = [[47.0, 8.0], [46.5, 7.5], [46.0, 7.0]];

    public Task<List<double[]>> GetRouteAsync(double fromLat, double fromLon, double toLat, double toLon, string profile = "driving-hgv", CancellationToken cancellationToken = default)
    {
        return Task.FromResult(ResultPoints);
    }
}
