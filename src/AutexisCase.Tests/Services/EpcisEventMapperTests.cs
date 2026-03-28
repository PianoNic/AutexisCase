using System.Text.Json;
using AutexisCase.Domain;
using AutexisCase.Domain.Enums;
using AutexisCase.Infrastructure.Services;

namespace AutexisCase.Tests.Services;

public class EpcisEventMapperTests
{
    private static (Product product, Batch batch) CreateTestData()
    {
        var product = new Product { Gtin = "7610848001015", Name = "Chocolate", Brand = "Lindt" };
        var batch = new Batch { LotNumber = "LOT-001", ProductId = product.Id };
        batch.JourneyEvents.Add(new JourneyEvent
        {
            BatchId = batch.Id, Step = "Ernte", Location = "Ghana",
            Latitude = 6.68, Longitude = -1.62,
            Timestamp = new DateTime(2026, 1, 15, 8, 0, 0, DateTimeKind.Utc),
            Status = JourneyStatus.Completed, Temperature = 28, Co2Kg = 0.3m
        });
        batch.JourneyEvents.Add(new JourneyEvent
        {
            BatchId = batch.Id, Step = "Transport", Location = "Highway",
            Latitude = 48.0, Longitude = 7.8,
            Timestamp = new DateTime(2026, 2, 20, 6, 0, 0, DateTimeKind.Utc),
            Status = JourneyStatus.Warning, Temperature = 24
        });
        batch.JourneyEvents.Add(new JourneyEvent
        {
            BatchId = batch.Id, Step = "Regal", Location = "Store",
            Latitude = 47.47, Longitude = 8.30,
            Timestamp = new DateTime(2026, 3, 1, 7, 0, 0, DateTimeKind.Utc),
            Status = JourneyStatus.Current
        });
        product.Batches.Add(batch);
        return (product, batch);
    }

    [Fact]
    public void Produces_valid_epcis_document()
    {
        var (product, batch) = CreateTestData();
        var json = EpcisEventMapper.ToEpcisDocument(product, batch);
        var doc = JsonDocument.Parse(json);

        Assert.Equal("EPCISDocument", doc.RootElement.GetProperty("type").GetString());
        Assert.Equal("2.0", doc.RootElement.GetProperty("schemaVersion").GetString());
    }

    [Fact]
    public void Contains_correct_number_of_events()
    {
        var (product, batch) = CreateTestData();
        var json = EpcisEventMapper.ToEpcisDocument(product, batch);
        var doc = JsonDocument.Parse(json);

        var events = doc.RootElement.GetProperty("epcisBody").GetProperty("eventList");
        Assert.Equal(3, events.GetArrayLength());
    }

    [Fact]
    public void Maps_epc_from_gtin_and_lot()
    {
        var (product, batch) = CreateTestData();
        var json = EpcisEventMapper.ToEpcisDocument(product, batch);
        var doc = JsonDocument.Parse(json);

        var firstEvent = doc.RootElement.GetProperty("epcisBody").GetProperty("eventList")[0];
        var epc = firstEvent.GetProperty("epcList")[0].GetString();
        Assert.Contains("7610848001015", epc);
        Assert.Contains("LOT-001", epc);
    }

    [Fact]
    public void Maps_ernte_to_commissioning()
    {
        var (product, batch) = CreateTestData();
        var json = EpcisEventMapper.ToEpcisDocument(product, batch);
        var doc = JsonDocument.Parse(json);

        var firstEvent = doc.RootElement.GetProperty("epcisBody").GetProperty("eventList")[0];
        Assert.Equal("commissioning", firstEvent.GetProperty("bizStep").GetString());
    }

    [Fact]
    public void Maps_transport_to_shipping()
    {
        var (product, batch) = CreateTestData();
        var json = EpcisEventMapper.ToEpcisDocument(product, batch);
        var doc = JsonDocument.Parse(json);

        var secondEvent = doc.RootElement.GetProperty("epcisBody").GetProperty("eventList")[1];
        Assert.Equal("shipping", secondEvent.GetProperty("bizStep").GetString());
    }

    [Fact]
    public void Maps_warning_status_to_damaged_disposition()
    {
        var (product, batch) = CreateTestData();
        var json = EpcisEventMapper.ToEpcisDocument(product, batch);
        var doc = JsonDocument.Parse(json);

        var warningEvent = doc.RootElement.GetProperty("epcisBody").GetProperty("eventList")[1];
        Assert.Equal("damaged", warningEvent.GetProperty("disposition").GetString());
    }

    [Fact]
    public void Maps_regal_to_retail_selling()
    {
        var (product, batch) = CreateTestData();
        var json = EpcisEventMapper.ToEpcisDocument(product, batch);
        var doc = JsonDocument.Parse(json);

        var storeEvent = doc.RootElement.GetProperty("epcisBody").GetProperty("eventList")[2];
        Assert.Equal("retail_selling", storeEvent.GetProperty("bizStep").GetString());
    }
}
