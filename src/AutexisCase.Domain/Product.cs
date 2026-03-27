namespace AutexisCase.Domain;

public class Product : BaseEntity
{
    public required string Gtin { get; set; }
    public required string Name { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? Category { get; set; }
    public string? Weight { get; set; }
    public string? Origin { get; set; }
    public List<string> Certifications { get; set; } = [];

    public string? NutriScore { get; set; }
    public int? NovaGroup { get; set; }
    public string? EcoScore { get; set; }

    public Nutrition Nutrition { get; set; } = new();

    public List<Batch> Batches { get; set; } = [];
}
