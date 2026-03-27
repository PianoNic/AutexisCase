namespace AutexisCase.Application.Interfaces;

public interface IRoutingService
{
    Task<List<double[]>> GetRouteAsync(double fromLat, double fromLon, double toLat, double toLon, string profile = "driving-hgv", CancellationToken cancellationToken = default);
}
