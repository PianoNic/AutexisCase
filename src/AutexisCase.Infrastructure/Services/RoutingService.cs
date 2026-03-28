using System.Text.Json;
using AutexisCase.Application.Interfaces;
using AutexisCase.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AutexisCase.Infrastructure.Services;

public class RoutingService(HttpClient httpClient, IConfiguration configuration, IAppDbContext dbContext) : IRoutingService
{
    private readonly string? _apiKey = configuration["OpenRouteService:ApiKey"];

    public async Task<List<double[]>> GetRouteAsync(double fromLat, double fromLon, double toLat, double toLon, string profile = "driving-hgv", CancellationToken cancellationToken = default)
    {
        // Generate cache key from rounded coordinates + profile
        var cacheKey = $"{fromLat:F4}_{fromLon:F4}_{toLat:F4}_{toLon:F4}_{profile}";

        // Check DB cache
        var cached = await dbContext.RouteCaches.AsNoTracking().FirstOrDefaultAsync(r => r.CacheKey == cacheKey && r.ExpiresAt > DateTime.UtcNow, cancellationToken);
        if (cached is not null)
            return JsonSerializer.Deserialize<List<double[]>>(cached.PointsJson) ?? [];

        // Compute route
        List<double[]> points;
        if (IsCrossOcean(fromLat, fromLon, toLat, toLon))
            points = GenerateGreatCircleArc(fromLat, fromLon, toLat, toLon);
        else
            points = await FetchRouteFromOrs(fromLat, fromLon, toLat, toLon, profile, cancellationToken);

        // Save to cache (30 days)
        var entry = new RouteCache
        {
            CacheKey = cacheKey,
            PointsJson = JsonSerializer.Serialize(points),
            Profile = profile,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
        };

        try
        {
            dbContext.RouteCaches.Add(entry);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // Race condition: another request cached it first — ignore
        }

        return points;
    }

    private async Task<List<double[]>> FetchRouteFromOrs(double fromLat, double fromLon, double toLat, double toLon, string profile, CancellationToken cancellationToken)
    {
        // Try ORS if key available, otherwise use free OSRM
        if (!string.IsNullOrEmpty(_apiKey))
        {
            try
            {
                var url = $"https://api.openrouteservice.org/v2/directions/{profile}?api_key={_apiKey}&start={fromLon},{fromLat}&end={toLon},{toLat}";
                var response = await httpClient.GetAsync(url, cancellationToken);

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync(cancellationToken);
                    var doc = JsonDocument.Parse(json);
                    var coordinates = doc.RootElement.GetProperty("features")[0].GetProperty("geometry").GetProperty("coordinates");
                    var points = new List<double[]>();
                    foreach (var coord in coordinates.EnumerateArray())
                        points.Add([coord[1].GetDouble(), coord[0].GetDouble()]);
                    return points;
                }
            }
            catch { /* fall through to OSRM */ }
        }

        // Fallback: OSRM (free, no key needed)
        try
        {
            var osrmProfile = profile.Contains("foot") ? "foot" : profile.Contains("cycling") ? "bike" : "car";
            var url = $"https://router.project-osrm.org/route/v1/{osrmProfile}/{fromLon},{fromLat};{toLon},{toLat}?overview=full&geometries=geojson";
            var response = await httpClient.GetAsync(url, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                var doc = JsonDocument.Parse(json);
                var coordinates = doc.RootElement.GetProperty("routes")[0].GetProperty("geometry").GetProperty("coordinates");
                var points = new List<double[]>();
                foreach (var coord in coordinates.EnumerateArray())
                    points.Add([coord[1].GetDouble(), coord[0].GetDouble()]);
                return points;
            }
        }
        catch { /* fall through to straight line */ }

        return GenerateStraightLine(fromLat, fromLon, toLat, toLon);
    }

    private static bool IsCrossOcean(double lat1, double lon1, double lat2, double lon2)
    {
        var lonDiff = Math.Abs(lon1 - lon2);
        if (lat1 < 15 && lat2 > 35 && lonDiff < 30) return true;
        if (lat2 < 15 && lat1 > 35 && lonDiff < 30) return true;
        if (lonDiff > 40) return true;
        return false;
    }

    private static List<double[]> GenerateGreatCircleArc(double lat1, double lon1, double lat2, double lon2, int segments = 50)
    {
        var points = new List<double[]>();
        var lat1Rad = lat1 * Math.PI / 180;
        var lon1Rad = lon1 * Math.PI / 180;
        var lat2Rad = lat2 * Math.PI / 180;
        var lon2Rad = lon2 * Math.PI / 180;

        for (int i = 0; i <= segments; i++)
        {
            var f = (double)i / segments;
            var d = Math.Acos(Math.Sin(lat1Rad) * Math.Sin(lat2Rad) + Math.Cos(lat1Rad) * Math.Cos(lat2Rad) * Math.Cos(lon2Rad - lon1Rad));

            if (d < 0.0001) { points.Add([lat1, lon1]); continue; }

            var a = Math.Sin((1 - f) * d) / Math.Sin(d);
            var b = Math.Sin(f * d) / Math.Sin(d);
            var x = a * Math.Cos(lat1Rad) * Math.Cos(lon1Rad) + b * Math.Cos(lat2Rad) * Math.Cos(lon2Rad);
            var y = a * Math.Cos(lat1Rad) * Math.Sin(lon1Rad) + b * Math.Cos(lat2Rad) * Math.Sin(lon2Rad);
            var z = a * Math.Sin(lat1Rad) + b * Math.Sin(lat2Rad);

            points.Add([Math.Atan2(z, Math.Sqrt(x * x + y * y)) * 180 / Math.PI, Math.Atan2(y, x) * 180 / Math.PI]);
        }

        return points;
    }

    private static List<double[]> GenerateStraightLine(double lat1, double lon1, double lat2, double lon2) => [[lat1, lon1], [lat2, lon2]];
}
