using System.Net;
using System.Text.Json;
using AutexisCase.Domain;
using AutexisCase.Infrastructure.Services;
using AutexisCase.Tests.Helpers;
using Microsoft.Extensions.Configuration;

namespace AutexisCase.Tests.Services;

public class RoutingServiceTests
{
    private static RoutingService CreateService(TestDbContext db, HttpMessageHandler? handler = null)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["OpenRouteService:ApiKey"] = "test-key" })
            .Build();
        var httpClient = new HttpClient(handler ?? new FakeHandler(HttpStatusCode.InternalServerError));
        return new RoutingService(httpClient, config, db);
    }

    [Fact]
    public async Task Returns_cached_route_when_available()
    {
        using var db = TestDbContext.Create();
        var cacheKey = "47.0000_8.0000_46.0000_7.0000_driving-hgv";
        var cachedPoints = new List<double[]> { new[] { 47.0, 8.0 }, new[] { 46.0, 7.0 } };
        db.RouteCaches.Add(new RouteCache
        {
            CacheKey = cacheKey,
            PointsJson = JsonSerializer.Serialize(cachedPoints),
            Profile = "driving-hgv",
            ExpiresAt = DateTime.UtcNow.AddDays(10),
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.GetRouteAsync(47.0, 8.0, 46.0, 7.0);

        Assert.Equal(2, result.Count);
        Assert.Equal(47.0, result[0][0]);
    }

    [Fact]
    public async Task Ignores_expired_cache()
    {
        using var db = TestDbContext.Create();
        var cacheKey = "47.0000_8.0000_46.0000_7.0000_driving-hgv";
        db.RouteCaches.Add(new RouteCache
        {
            CacheKey = cacheKey,
            PointsJson = "[[99,99]]",
            Profile = "driving-hgv",
            ExpiresAt = DateTime.UtcNow.AddDays(-1),
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.GetRouteAsync(47.0, 8.0, 46.0, 7.0);

        // Should NOT return the cached [99,99] value
        Assert.NotEqual(99.0, result[0][0]);
    }

    [Fact]
    public async Task Falls_back_to_straight_line_on_ors_failure()
    {
        using var db = TestDbContext.Create();
        var service = CreateService(db, new FakeHandler(HttpStatusCode.InternalServerError));

        var result = await service.GetRouteAsync(47.0, 8.0, 46.0, 7.0);

        Assert.Equal(2, result.Count);
        Assert.Equal(47.0, result[0][0]);
        Assert.Equal(8.0, result[0][1]);
        Assert.Equal(46.0, result[1][0]);
        Assert.Equal(7.0, result[1][1]);
    }

    [Fact]
    public async Task Uses_great_circle_for_cross_ocean_routes()
    {
        using var db = TestDbContext.Create();
        var service = CreateService(db);
        var result = await service.GetRouteAsync(47.0, 8.0, 35.0, -80.0);

        Assert.Equal(51, result.Count);
    }

    [Fact]
    public async Task Caches_result_after_fetching()
    {
        using var db = TestDbContext.Create();
        var service = CreateService(db, new FakeHandler(HttpStatusCode.InternalServerError));

        await service.GetRouteAsync(47.0, 8.0, 46.0, 7.0);

        Assert.Single(db.RouteCaches);
        Assert.Equal("47.0000_8.0000_46.0000_7.0000_driving-hgv", db.RouteCaches.First().CacheKey);
    }

    [Fact]
    public async Task Parses_ors_response_correctly()
    {
        using var db = TestDbContext.Create();
        var orsResponse = new
        {
            features = new[]
            {
                new
                {
                    geometry = new
                    {
                        coordinates = new[] { new[] { 8.0, 47.0 }, new[] { 7.5, 46.5 }, new[] { 7.0, 46.0 } }
                    }
                }
            }
        };

        var handler = new FakeHandler(HttpStatusCode.OK, JsonSerializer.Serialize(orsResponse));
        var service = CreateService(db, handler);

        var result = await service.GetRouteAsync(47.0, 8.0, 46.0, 7.0);

        Assert.Equal(3, result.Count);
        Assert.Equal(47.0, result[0][0]);
        Assert.Equal(8.0, result[0][1]);
    }

    [Fact]
    public async Task Uses_profile_in_cache_key()
    {
        using var db = TestDbContext.Create();
        var service = CreateService(db, new FakeHandler(HttpStatusCode.InternalServerError));

        await service.GetRouteAsync(47.0, 8.0, 46.0, 7.0, "cycling-regular");

        Assert.Contains("cycling-regular", db.RouteCaches.First().CacheKey);
    }

    [Fact]
    public void Does_not_throw_when_api_key_not_configured()
    {
        using var db = TestDbContext.Create();
        var config = new ConfigurationBuilder().AddInMemoryCollection().Build();
        var service = new RoutingService(new HttpClient(), config, db);
        Assert.NotNull(service);
    }
}

public class FakeHandler : HttpMessageHandler
{
    private readonly HttpStatusCode _statusCode;
    private readonly string? _content;

    public FakeHandler(HttpStatusCode statusCode, string? content = null)
    {
        _statusCode = statusCode;
        _content = content;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var response = new HttpResponseMessage(_statusCode);
        if (_content is not null) response.Content = new StringContent(_content);
        return Task.FromResult(response);
    }
}
