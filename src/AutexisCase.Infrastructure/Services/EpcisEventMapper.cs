using System.Text.Json;
using AutexisCase.Domain;
using AutexisCase.Domain.Enums;

namespace AutexisCase.Infrastructure.Services;

public static class EpcisEventMapper
{
    public static string ToEpcisDocument(Product product, Batch batch)
    {
        var epc = $"urn:epc:id:sgtin:{product.Gtin}.{batch.LotNumber}";
        var events = batch.JourneyEvents
            .OrderBy(j => j.Timestamp)
            .Select(j => ToObjectEvent(j, epc))
            .ToList();

        var doc = new
        {
            @context = new[] { "https://ref.gs1.org/standards/epcis/2.0.0/epcis-context.jsonld" },
            type = "EPCISDocument",
            schemaVersion = "2.0",
            creationDate = DateTime.UtcNow.ToString("O"),
            epcisBody = new
            {
                eventList = events
            }
        };

        return JsonSerializer.Serialize(doc, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
    }

    private static object ToObjectEvent(JourneyEvent j, string epc)
    {
        return new
        {
            type = "ObjectEvent",
            eventTime = j.Timestamp.ToString("O"),
            eventTimeZoneOffset = "+01:00",
            epcList = new[] { epc },
            action = j.Status == JourneyStatus.Completed ? "OBSERVE" : "ADD",
            bizStep = MapBizStep(j.Step),
            disposition = MapDisposition(j.Status),
            readPoint = new { id = $"urn:epc:id:sgln:{j.Latitude:F4}.{j.Longitude:F4}" },
            bizLocation = new { id = $"urn:epc:id:sgln:{j.Latitude:F4}.{j.Longitude:F4}" },
            // Extensions for our app-specific data
            ilmd = new Dictionary<string, object?>
            {
                ["location"] = j.Location,
                ["step"] = j.Step,
                ["temperature"] = j.Temperature,
                ["co2Kg"] = j.Co2Kg,
                ["waterLiters"] = j.WaterLiters,
                ["cost"] = j.Cost,
                ["details"] = j.Details
            }
        };
    }

    private static string MapBizStep(string step)
    {
        var lower = step.ToLowerInvariant();
        if (lower.Contains("ernte") || lower.Contains("farm") || lower.Contains("harvest")) return "commissioning";
        if (lower.Contains("verarbeitung") || lower.Contains("factory") || lower.Contains("processing")) return "commissioning";
        if (lower.Contains("transport") || lower.Contains("truck") || lower.Contains("shipping")) return "shipping";
        if (lower.Contains("lager") || lower.Contains("warehouse") || lower.Contains("storing")) return "receiving";
        if (lower.Contains("regal") || lower.Contains("store") || lower.Contains("retail")) return "retail_selling";
        return "inspecting";
    }

    private static string MapDisposition(JourneyStatus status) => status switch
    {
        JourneyStatus.Completed => "active",
        JourneyStatus.Current => "sellable_accessible",
        JourneyStatus.Warning => "damaged",
        _ => "active"
    };
}
