using AutexisCase.Domain;
using AutexisCase.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Infrastructure;

public static class SeedData
{
    public static async Task SeedAsync(AutexisCaseDbContext dbContext)
    {
        if (await dbContext.Products.AnyAsync()) return;

        var chocolate = new Product
        {
            Id = Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567890"),
            Gtin = "7610848001015",
            Name = "Swiss Dark Chocolate 72%",
            Brand = "Lindt",
            Category = "Süsswaren",
            Weight = "100g",
            Origin = "Ghana → Belgien → Schweiz",
            Certifications = ["Fairtrade", "UTZ Certified"],
            NutriScore = "D",
            NovaGroup = 4,
            EcoScore = "C",
            RiskScore = 72,
            ShelfLifeDays = 365,
            DaysRemaining = 120,
            Co2Kg = 2.3m,
            WaterLiters = 1700m,
            Status = ProductStatus.Warning,
            Nutrition = new Nutrition
            {
                EnergyKcal = 546, Fat = 33, SaturatedFat = 20, Carbs = 46,
                Sugars = 40, Fiber = 8, Protein = 8, Salt = 0.03m
            },
            JourneyEvents =
            [
                new JourneyEvent
                {
                    Step = "Ernte", Location = "Kumasi, Ghana", Latitude = 6.6885, Longitude = -1.6244,
                    Timestamp = new DateTime(2026, 1, 15, 8, 0, 0, DateTimeKind.Utc),
                    Status = JourneyStatus.Completed, Icon = "sprout", Temperature = 28,
                    Details = "Kakao geerntet von zertifizierter Fairtrade-Farm",
                    Co2Kg = 0.3m, WaterLiters = 800, Cost = 0.45m
                },
                new JourneyEvent
                {
                    Step = "Verarbeitung", Location = "Brüssel, Belgien", Latitude = 50.8503, Longitude = 4.3517,
                    Timestamp = new DateTime(2026, 2, 5, 14, 0, 0, DateTimeKind.Utc),
                    Status = JourneyStatus.Completed, Icon = "factory", Temperature = 22,
                    Details = "Kakaobohnen geröstet und zu Schokolade verarbeitet",
                    Co2Kg = 0.8m, WaterLiters = 500, Cost = 1.20m
                },
                new JourneyEvent
                {
                    Step = "Transport", Location = "Autobahn A5, Deutschland", Latitude = 48.0, Longitude = 7.8,
                    Timestamp = new DateTime(2026, 2, 20, 6, 30, 0, DateTimeKind.Utc),
                    Status = JourneyStatus.Warning, Icon = "truck", Temperature = 24,
                    Details = "Kühlkettenunterbrechung erkannt – Temperatur stieg auf 24°C für 3 Stunden",
                    Co2Kg = 0.9m, WaterLiters = 50, Cost = 0.60m
                },
                new JourneyEvent
                {
                    Step = "Lager", Location = "Zürich, Schweiz", Latitude = 47.3769, Longitude = 8.5417,
                    Timestamp = new DateTime(2026, 2, 22, 10, 0, 0, DateTimeKind.Utc),
                    Status = JourneyStatus.Completed, Icon = "warehouse", Temperature = 16,
                    Details = "Eingelagert im Zentrallager",
                    Co2Kg = 0.1m, WaterLiters = 10, Cost = 0.30m
                },
                new JourneyEvent
                {
                    Step = "Regal", Location = "Coop Baden, Schweiz", Latitude = 47.4734, Longitude = 8.3064,
                    Timestamp = new DateTime(2026, 3, 1, 7, 0, 0, DateTimeKind.Utc),
                    Status = JourneyStatus.Current, Icon = "store", Temperature = 20,
                    Details = "Im Verkaufsregal platziert",
                    Co2Kg = 0.2m, WaterLiters = 5, Cost = 0.95m
                }
            ],
            PriceBreakdown =
            [
                new PriceStep { Stage = "Erzeuger", Amount = 0.45m, Percentage = 12.9m },
                new PriceStep { Stage = "Verarbeitung", Amount = 1.20m, Percentage = 34.3m },
                new PriceStep { Stage = "Transport", Amount = 0.60m, Percentage = 17.1m },
                new PriceStep { Stage = "Einzelhandel", Amount = 1.25m, Percentage = 35.7m }
            ],
            TemperatureLogs =
            [
                new TemperatureLog { Time = new DateTime(2026, 2, 20, 4, 0, 0, DateTimeKind.Utc), Temperature = 16, Location = "LKW Abfahrt Belgien" },
                new TemperatureLog { Time = new DateTime(2026, 2, 20, 6, 0, 0, DateTimeKind.Utc), Temperature = 18, Location = "Autobahn A5" },
                new TemperatureLog { Time = new DateTime(2026, 2, 20, 8, 0, 0, DateTimeKind.Utc), Temperature = 22, Location = "Autobahn A5 Rastplatz" },
                new TemperatureLog { Time = new DateTime(2026, 2, 20, 9, 30, 0, DateTimeKind.Utc), Temperature = 24, Location = "Autobahn A5 Stau" },
                new TemperatureLog { Time = new DateTime(2026, 2, 20, 12, 0, 0, DateTimeKind.Utc), Temperature = 18, Location = "Grenze CH" },
                new TemperatureLog { Time = new DateTime(2026, 2, 22, 10, 0, 0, DateTimeKind.Utc), Temperature = 16, Location = "Zentrallager Zürich" }
            ],
            Alerts =
            [
                new Alert
                {
                    Type = AlertType.ColdChain, Severity = AlertSeverity.Warning,
                    Title = "Kühlkettenunterbrechung",
                    Description = "Temperatur stieg während des Transports auf 24°C. Diese Charge hat ein 72% Risiko für Qualitätsverlust basierend auf Temperaturabweichungen.",
                    Timestamp = new DateTime(2026, 2, 20, 9, 30, 0, DateTimeKind.Utc),
                    Read = false
                }
            ]
        };

        dbContext.Products.Add(chocolate);
        await dbContext.SaveChangesAsync();
    }
}
