namespace AutexisCase.Domain;

public class RouteCache : BaseEntity
{
    public required string CacheKey { get; set; }
    public required string PointsJson { get; set; }
    public string Profile { get; set; } = "driving-hgv";
    public DateTime ExpiresAt { get; set; }
}
