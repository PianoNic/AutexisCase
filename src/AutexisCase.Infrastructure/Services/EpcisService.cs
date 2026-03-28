using System.Text.Json;
using AutexisCase.Application.Interfaces;
using AutexisCase.Domain;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Infrastructure.Services;

public class EpcisService(IAppDbContext dbContext) : IEpcisService
{
    public async Task<HttpResponseMessage> CaptureEventsAsync(string epcisDocumentJson, CancellationToken cancellationToken = default)
    {
        try
        {
            var doc = JsonDocument.Parse(epcisDocumentJson);
            var eventList = doc.RootElement.GetProperty("epcisBody").GetProperty("eventList");

            foreach (var evt in eventList.EnumerateArray())
            {
                var epc = evt.GetProperty("epcList")[0].GetString() ?? "";
                dbContext.EpcisEvents.Add(new EpcisEvent
                {
                    Epc = epc,
                    EventType = evt.GetProperty("type").GetString() ?? "ObjectEvent",
                    EventTime = DateTime.Parse(evt.GetProperty("eventTime").GetString()!, null, System.Globalization.DateTimeStyles.AdjustToUniversal),
                    BizStep = evt.GetProperty("bizStep").GetString() ?? "",
                    Disposition = evt.GetProperty("disposition").GetString() ?? "",
                    ReadPoint = evt.TryGetProperty("readPoint", out var rp) ? rp.GetProperty("id").GetString() ?? "" : "",
                    BizLocation = evt.TryGetProperty("bizLocation", out var bl) ? bl.GetProperty("id").GetString() ?? "" : "",
                    Action = evt.TryGetProperty("action", out var act) ? act.GetString() ?? "OBSERVE" : "OBSERVE",
                    RawJson = evt.GetRawText(),
                });
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return new HttpResponseMessage(System.Net.HttpStatusCode.Created);
        }
        catch (Exception)
        {
            return new HttpResponseMessage(System.Net.HttpStatusCode.BadRequest);
        }
    }

    public async Task<string> QueryEventsAsync(string queryString, CancellationToken cancellationToken = default)
    {
        var query = dbContext.EpcisEvents.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(queryString))
        {
            var parameters = System.Web.HttpUtility.ParseQueryString(queryString);
            var epc = parameters["EQ_epc"];
            if (!string.IsNullOrEmpty(epc)) query = query.Where(e => e.Epc == epc);

            var bizStep = parameters["EQ_bizStep"];
            if (!string.IsNullOrEmpty(bizStep)) query = query.Where(e => e.BizStep == bizStep);
        }

        var events = await query.OrderBy(e => e.EventTime).ToListAsync(cancellationToken);

        var eventJsonArray = events
            .Where(e => e.RawJson != null)
            .Select(e => JsonDocument.Parse(e.RawJson!).RootElement)
            .ToList();

        var result = new
        {
            @context = new[] { "https://ref.gs1.org/standards/epcis/2.0.0/epcis-context.jsonld" },
            type = "EPCISQueryDocument",
            schemaVersion = "2.0",
            epcisBody = new { queryResults = new { resultsBody = new { eventList = eventJsonArray } } }
        };

        return JsonSerializer.Serialize(result, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
    }
}
