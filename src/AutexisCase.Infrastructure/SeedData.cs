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
            Nutrition = new Nutrition
            {
                EnergyKcal = 546, Fat = 33, SaturatedFat = 20, Carbs = 46,
                Sugars = 40, Fiber = 8, Protein = 8, Salt = 0.03m
            },
            Batches =
            [
                new Batch
                {
                    Id = Guid.Parse("f1000000-0000-0000-0000-000000000001"),
                    LotNumber = "LX-2026-0142",
                    Status = ProductStatus.Recall,
                    RiskScore = 95,
                    ShelfLifeDays = 365,
                    DaysRemaining = 120,
                    Co2Kg = 2.3m,
                    WaterLiters = 1700m,
                    ProductionDate = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc),
                    ExpiryDate = new DateTime(2027, 1, 10, 0, 0, 0, DateTimeKind.Utc),
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
                            Step = "Qualitätskontrolle", Location = "Zürich, Schweiz", Latitude = 47.3769, Longitude = 8.5417,
                            Timestamp = new DateTime(2026, 2, 22, 10, 0, 0, DateTimeKind.Utc),
                            Status = JourneyStatus.Warning, Icon = "warehouse", Temperature = 16,
                            Details = "RÜCKRUF: Metallfremdkörper (Stahlspäne, ≤2mm) im Zentrallager bei Eingangsqualitätsprüfung nachgewiesen. Defekte Walzanlage in Brüsseler Verarbeitungsbetrieb. BLV-Meldung Nr. 2026-0298 erstattet.",
                            Co2Kg = 0.1m, WaterLiters = 10, Cost = 0.30m
                        },
                        new JourneyEvent
                        {
                            Step = "Rückruf", Location = "Schweizweit", Latitude = 47.3769, Longitude = 8.5417,
                            Timestamp = new DateTime(2026, 2, 25, 9, 0, 0, DateTimeKind.Utc),
                            Status = JourneyStatus.Warning, Icon = "store", Temperature = 20,
                            Details = "Sofortiger Verkaufsstopp und Rückruf aller betroffenen Chargen (LX-2026-0138 bis LX-2026-0145). Kunden werden gebeten, das Produkt nicht zu konsumieren und im Laden zurückzugeben.",
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
                            Type = AlertType.Recall, Severity = AlertSeverity.Critical,
                            Title = "Produktrückruf — Metallfremdkörper",
                            Description = "In der Charge LX-2026-0142 wurden Stahlspäne (≤2mm) nachgewiesen. Defekte Walzanlage im Verarbeitungsbetrieb Brüssel. Verletzungsgefahr beim Verzehr. Sofortiger Rückruf durch BLV angeordnet. Produkt NICHT konsumieren.",
                            Timestamp = new DateTime(2026, 2, 22, 10, 0, 0, DateTimeKind.Utc),
                            Read = false
                        },
                        new Alert
                        {
                            Type = AlertType.ColdChain, Severity = AlertSeverity.Warning,
                            Title = "Kühlkettenunterbrechung",
                            Description = "Temperatur stieg während des Transports auf 24°C für 3 Stunden. Qualitätsverlust möglich.",
                            Timestamp = new DateTime(2026, 2, 20, 9, 30, 0, DateTimeKind.Utc),
                            Read = false
                        }
                    ]
                }
            ]
        };

        var pistachioChocolate = new Product
        {
            Id = Guid.Parse("b2c3d4e5-f6a7-8901-bcde-f12345678901"),
            Gtin = "7616500663992",
            Name = "Feine Milchschokolade Pistazie",
            Brand = "Frey (Migros)",
            Category = "Süsswaren",
            Weight = "100g",
            Origin = "Elfenbeinküste → Türkei → Schweiz",
            Certifications = ["Rainforest Alliance", "FSC Mix"],
            NutriScore = "E",
            NovaGroup = 4,
            EcoScore = "C",
            Nutrition = new Nutrition
            {
                EnergyKcal = 563, Fat = 36, SaturatedFat = 17, Carbs = 50,
                Sugars = 48, Fiber = 3.4m, Protein = 8.1m, Salt = 0.20m
            },
            Batches =
            [
                new Batch
                {
                    Id = Guid.Parse("f2000000-0000-0000-0000-000000000002"),
                    LotNumber = "L2024456653",
                    Status = ProductStatus.Recall,
                    RiskScore = 92,
                    ShelfLifeDays = 365,
                    DaysRemaining = 280,
                    Co2Kg = 3.1m,
                    WaterLiters = 2400m,
                    ProductionDate = new DateTime(2025, 11, 15, 0, 0, 0, DateTimeKind.Utc),
                    ExpiryDate = new DateTime(2026, 11, 15, 0, 0, 0, DateTimeKind.Utc),
                    JourneyEvents =
                    [
                        new JourneyEvent
                        {
                            Step = "Kakao-Ernte", Location = "Necaayo-Kooperative, Elfenbeinküste", Latitude = 6.8276, Longitude = -5.2893,
                            Timestamp = new DateTime(2025, 8, 20, 6, 0, 0, DateTimeKind.Utc),
                            Status = JourneyStatus.Completed, Icon = "sprout", Temperature = 30,
                            Details = "Kakaobohnen geerntet von der Necaayo-Kooperative – Delica/Chocolat Frey bezieht seit 2012 exklusiv ~1'500 Tonnen/Jahr von dieser Partnerschaft. Rainforest Alliance zertifiziert seit 2013. Fermentation 6 Tage, Sonnentrocknung 7 Tage.",
                            Co2Kg = 0.25m, WaterLiters = 1200, Cost = 0.38m
                        },
                        new JourneyEvent
                        {
                            Step = "Pistazien-Ernte", Location = "Gaziantep, Türkei", Latitude = 37.0662, Longitude = 37.3833,
                            Timestamp = new DateTime(2025, 9, 5, 7, 0, 0, DateTimeKind.Utc),
                            Status = JourneyStatus.Completed, Icon = "sprout", Temperature = 26,
                            Details = "Antep-Pistazien (7% Anteil) aus der Region Gaziantep – 85% der türkischen Pistazienproduktion. Türkei produzierte 2024/25 rekordhohe 385'000 Tonnen. Schälung, Sortierung und Röstung vor Ort. Export via Mersin nach Europa.",
                            Co2Kg = 0.15m, WaterLiters = 350, Cost = 0.85m
                        },
                        new JourneyEvent
                        {
                            Step = "Haselnuss-Beschaffung", Location = "Giresun, Schwarzmeerregion, Türkei", Latitude = 40.9128, Longitude = 38.3895,
                            Timestamp = new DateTime(2025, 9, 12, 8, 0, 0, DateTimeKind.Utc),
                            Status = JourneyStatus.Completed, Icon = "sprout", Temperature = 22,
                            Details = "Haselnüsse (Giresun-Qualität) aus der Schwarzmeerregion – Türkei liefert 70% der Weltproduktion. Mandeln aus Valencia, Spanien via Konsolidierung Istanbul. Röstung und Mahlung vor Verschiffung.",
                            Co2Kg = 0.20m, WaterLiters = 280, Cost = 0.55m
                        },
                        new JourneyEvent
                        {
                            Step = "Seetransport", Location = "Mittelmeer (Abidjan → Mersin → Genua)", Latitude = 38.5, Longitude = 18.0,
                            Timestamp = new DateTime(2025, 10, 1, 12, 0, 0, DateTimeKind.Utc),
                            Status = JourneyStatus.Completed, Icon = "ship", Temperature = 18,
                            Details = "Kakao ab Hafen Abidjan, Nüsse ab Mersin/Istanbul – Konsolidierung in Genua. 12 Tage Seetransport. Temperaturkontrollierter 20ft-Container (max. 18°C). Weiter per Bahn nach Schweiz.",
                            Co2Kg = 0.60m, WaterLiters = 30, Cost = 0.25m
                        },
                        new JourneyEvent
                        {
                            Step = "Schweizer Milch", Location = "Emmi, Luzern/Konolfingen", Latitude = 46.9500, Longitude = 7.7333,
                            Timestamp = new DateTime(2025, 10, 20, 5, 30, 0, DateTimeKind.Utc),
                            Status = JourneyStatus.Completed, Icon = "milk", Temperature = 4,
                            Details = "Vollmilch- und Magermilchpulver von der Zentralschweizer Milchvereinigung (Emmi-Vorgänger, gegr. 1907). 62 Genossenschaften, 1'768 Milchbauern. Sprühtrocknung in Konolfingen. 100% Schweizer Milch.",
                            Co2Kg = 0.35m, WaterLiters = 450, Cost = 0.42m
                        },
                        new JourneyEvent
                        {
                            Step = "Verarbeitung", Location = "Delica/Chocolat Frey, Buchs AG", Latitude = 47.3875, Longitude = 8.0814,
                            Timestamp = new DateTime(2025, 11, 10, 6, 0, 0, DateTimeKind.Utc),
                            Status = JourneyStatus.Completed, Icon = "factory", Temperature = 20,
                            Details = "Conchierung (72h) in der grössten Schweizer Schokoladenfabrik. Pralinenfüllung mit gemahlenen Antep-Pistazien, Mandeln und Haselnüssen. CO₂-reduzierter Betrieb dank Fernwärme (Energieverbrauch um 25% gesenkt). Qualitätskontrolle bestanden.",
                            Co2Kg = 0.90m, WaterLiters = 60, Cost = 1.10m
                        },
                        new JourneyEvent
                        {
                            Step = "Zentrallager", Location = "MVB Suhr AG, Schweiz", Latitude = 47.3714, Longitude = 8.0803,
                            Timestamp = new DateTime(2025, 11, 14, 8, 0, 0, DateTimeKind.Utc),
                            Status = JourneyStatus.Completed, Icon = "warehouse", Temperature = 16,
                            Details = "Migros Verteilbetrieb AG Suhr – grösstes Logistikzentrum der Schweiz. Versorgt 600+ Filialen und 300 Migrolino-Shops. WITRON OPM-System: 315'000+ Gebinde täglich. Einlagerung bei 16°C.",
                            Co2Kg = 0.10m, WaterLiters = 5, Cost = 0.20m
                        },
                        new JourneyEvent
                        {
                            Step = "Transport", Location = "Autobahn A1, Schweiz", Latitude = 47.4200, Longitude = 8.2500,
                            Timestamp = new DateTime(2025, 11, 18, 4, 30, 0, DateTimeKind.Utc),
                            Status = JourneyStatus.Warning, Icon = "truck", Temperature = 28,
                            Details = "KÜHLKETTEN-BRUCH: Kühlaggregat des LKW ausgefallen. Temperatur stieg auf 28°C für 3 Stunden. Schokolade wurde direkter Sonneneinstrahlung ausgesetzt. Fettreif und Qualitätsverlust wahrscheinlich.",
                            Co2Kg = 0.15m, WaterLiters = 2, Cost = 0.18m
                        },
                        new JourneyEvent
                        {
                            Step = "Regal", Location = "Migros Baden, Schweiz", Latitude = 47.4734, Longitude = 8.3064,
                            Timestamp = new DateTime(2025, 11, 18, 7, 0, 0, DateTimeKind.Utc),
                            Status = JourneyStatus.Current, Icon = "store", Temperature = 20,
                            Details = "Im Verkaufsregal platziert (Gang 4, Süsswaren). Regaltemperatur 20°C. MHD: 15.11.2026.",
                            Co2Kg = 0.40m, WaterLiters = 3, Cost = 1.57m
                        }
                    ],
                    PriceBreakdown =
                    [
                        new PriceStep { Stage = "Rohstoffe (Kakao, Nüsse, Milch)", Amount = 2.20m, Percentage = 40.0m },
                        new PriceStep { Stage = "Verarbeitung (Chocolat Frey)", Amount = 1.10m, Percentage = 20.0m },
                        new PriceStep { Stage = "Transport & Logistik", Amount = 0.43m, Percentage = 7.8m },
                        new PriceStep { Stage = "Migros Marge & Betrieb", Amount = 1.77m, Percentage = 32.2m }
                    ],
                    TemperatureLogs =
                    [
                        new TemperatureLog { Time = new DateTime(2025, 10, 1, 12, 0, 0, DateTimeKind.Utc), Temperature = 18, Location = "Container Istanbul" },
                        new TemperatureLog { Time = new DateTime(2025, 10, 5, 12, 0, 0, DateTimeKind.Utc), Temperature = 17, Location = "Mittelmeer" },
                        new TemperatureLog { Time = new DateTime(2025, 10, 9, 8, 0, 0, DateTimeKind.Utc), Temperature = 18, Location = "Hafen Genua" },
                        new TemperatureLog { Time = new DateTime(2025, 11, 10, 6, 0, 0, DateTimeKind.Utc), Temperature = 20, Location = "Fabrik Buchs AG" },
                        new TemperatureLog { Time = new DateTime(2025, 11, 10, 18, 0, 0, DateTimeKind.Utc), Temperature = 12, Location = "Kühltunnel Fabrik" },
                        new TemperatureLog { Time = new DateTime(2025, 11, 14, 8, 0, 0, DateTimeKind.Utc), Temperature = 16, Location = "Zentrallager Suhr" },
                        new TemperatureLog { Time = new DateTime(2025, 11, 18, 4, 30, 0, DateTimeKind.Utc), Temperature = 15, Location = "LKW Abfahrt Suhr" },
                        new TemperatureLog { Time = new DateTime(2025, 11, 18, 5, 0, 0, DateTimeKind.Utc), Temperature = 19, Location = "Autobahn A1 — Kühlung ausgefallen" },
                        new TemperatureLog { Time = new DateTime(2025, 11, 18, 5, 30, 0, DateTimeKind.Utc), Temperature = 24, Location = "Autobahn A1 — Temperaturanstieg" },
                        new TemperatureLog { Time = new DateTime(2025, 11, 18, 6, 0, 0, DateTimeKind.Utc), Temperature = 28, Location = "Autobahn A1 — Maximaltemperatur" },
                        new TemperatureLog { Time = new DateTime(2025, 11, 18, 6, 30, 0, DateTimeKind.Utc), Temperature = 26, Location = "Ankunft Migros Baden" },
                        new TemperatureLog { Time = new DateTime(2025, 11, 18, 7, 0, 0, DateTimeKind.Utc), Temperature = 20, Location = "Verkaufsregal" }
                    ],
                    Alerts =
                    [
                        new Alert
                        {
                            Type = AlertType.ColdChain,
                            Severity = AlertSeverity.Critical,
                            Title = "Schwerer Kühlkettenbruch",
                            Description = "Temperatur stieg auf 28°C für 3 Stunden während des Transports. Kühlaggregat ausgefallen auf der A1. Qualität der Schokolade beeinträchtigt — Fettreif und Geschmacksveränderung möglich.",
                            Timestamp = new DateTime(2025, 11, 18, 5, 0, 0, DateTimeKind.Utc),
                            Read = false
                        },
                        new Alert
                        {
                            Type = AlertType.Recall,
                            Severity = AlertSeverity.Critical,
                            Title = "Produktrückruf: Charge L2024456653",
                            Description = "Aufgrund des Kühlkettenbruchs wird die gesamte Charge L2024456653 zurückgerufen. Betroffene Filialen: Migros Baden, Migros Brugg, Migros Wettingen. Bitte nicht konsumieren.",
                            Timestamp = new DateTime(2025, 11, 18, 10, 0, 0, DateTimeKind.Utc),
                            Read = false
                        }
                    ]
                }
            ]
        };

        var muesli = new Product
        {
            Id = Guid.Parse("c3d4e5f6-a7b8-9012-cdef-123456789012"),
            Gtin = "7613035839427",
            Name = "Bio Crunchy Müesli",
            Brand = "Familia",
            Category = "Frühstück",
            Weight = "600g",
            Origin = "Schweiz",
            Certifications = ["Bio Suisse", "EU Bio"],
            NutriScore = "B",
            NovaGroup = 3,
            EcoScore = "A",
            Nutrition = new Nutrition
            {
                EnergyKcal = 425, Fat = 14, SaturatedFat = 2.5m, Carbs = 60,
                Sugars = 18, Fiber = 8, Protein = 11, Salt = 0.05m
            },
            Batches =
            [
                new Batch
                {
                    Id = Guid.Parse("f3000000-0000-0000-0000-000000000003"),
                    LotNumber = "BM-2026-0087",
                    Status = ProductStatus.Recall,
                    RiskScore = 98,
                    ShelfLifeDays = 270,
                    DaysRemaining = 195,
                    Co2Kg = 0.8m,
                    WaterLiters = 520m,
                    ProductionDate = new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc),
                    ExpiryDate = new DateTime(2026, 10, 28, 0, 0, 0, DateTimeKind.Utc),
                    JourneyEvents =
                    [
                        new JourneyEvent
                        {
                            Step = "Ernte", Location = "Thurgau, Schweiz", Latitude = 47.5535, Longitude = 9.0581,
                            Timestamp = new DateTime(2026, 1, 10, 7, 0, 0, DateTimeKind.Utc),
                            Status = JourneyStatus.Completed, Icon = "sprout", Temperature = 4,
                            Details = "Bio-Hafer und Dinkel geerntet von zertifiziertem Bio-Suisse-Betrieb (Hof Müller, 45ha).",
                            Co2Kg = 0.1m, WaterLiters = 200, Cost = 0.80m
                        },
                        new JourneyEvent
                        {
                            Step = "Verarbeitung", Location = "Sachseln OW, Schweiz", Latitude = 46.8636, Longitude = 8.2328,
                            Timestamp = new DateTime(2026, 1, 28, 6, 0, 0, DateTimeKind.Utc),
                            Status = JourneyStatus.Warning, Icon = "factory", Temperature = 18,
                            Details = "RÜCKRUF: Salmonellen (S. Typhimurium) in Stichprobe der Haferflocken nachgewiesen. Kontamination wahrscheinlich durch unzureichende Erhitzung während des Röstvorgangs. BLV-Meldung Nr. 2026-0341 erstattet.",
                            Co2Kg = 0.3m, WaterLiters = 150, Cost = 1.50m
                        },
                        new JourneyEvent
                        {
                            Step = "Rückruf", Location = "Schweizweit", Latitude = 46.9480, Longitude = 7.4474,
                            Timestamp = new DateTime(2026, 2, 5, 9, 0, 0, DateTimeKind.Utc),
                            Status = JourneyStatus.Warning, Icon = "store", Temperature = 20,
                            Details = "Sofortiger Verkaufsstopp und Rückruf aller betroffenen Chargen (BM-2026-0080 bis BM-2026-0091) wegen Salmonellen-Kontamination. Kunden werden gebeten, das Produkt nicht zu konsumieren und im Laden zurückzugeben.",
                            Co2Kg = 0.4m, WaterLiters = 10, Cost = 3.20m
                        }
                    ],
                    PriceBreakdown =
                    [
                        new PriceStep { Stage = "Rohstoffe (Bio-Hafer, Dinkel)", Amount = 0.80m, Percentage = 14.5m },
                        new PriceStep { Stage = "Verarbeitung", Amount = 1.50m, Percentage = 27.3m },
                        new PriceStep { Stage = "Rückruf & Krisenmanagement", Amount = 3.20m, Percentage = 58.2m }
                    ],
                    TemperatureLogs = [],
                    Alerts =
                    [
                        new Alert
                        {
                            Type = AlertType.Recall, Severity = AlertSeverity.Critical,
                            Title = "Produktrückruf — Salmonellen",
                            Description = "In der Charge BM-2026-0087 wurden Salmonella Typhimurium nachgewiesen. Erkrankungsrisiko durch Verzehr. Sofortiger Rückruf durch BLV angeordnet. Produkt NICHT konsumieren.",
                            Timestamp = new DateTime(2026, 2, 5, 8, 0, 0, DateTimeKind.Utc),
                            Read = false
                        },
                        new Alert
                        {
                            Type = AlertType.Recall, Severity = AlertSeverity.Critical,
                            Title = "Mikrobiologische Kontamination bestätigt",
                            Description = "Laboranalyse bestätigt Salmonellen-Kontamination in Charge BM-2026-0087. Unzureichende Erhitzung während Röstvorgang als Ursache identifiziert. Gesamte Tagesproduktion (12 Chargen) gesperrt.",
                            Timestamp = new DateTime(2026, 2, 3, 14, 0, 0, DateTimeKind.Utc),
                            Read = false
                        }
                    ]
                }
            ]
        };

        dbContext.Products.AddRange(chocolate, pistachioChocolate, muesli);
        await dbContext.SaveChangesAsync();
    }
}
