using System.Text;
using AutexisCase.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AutexisCase.Infrastructure.Services;

public class EpcisService(HttpClient httpClient, IConfiguration configuration, ILogger<EpcisService> logger) : IEpcisService
{
    private readonly string _baseUrl = configuration["Epcis:BaseUrl"] ?? "http://localhost:8099/epcis";

    public async Task<HttpResponseMessage> CaptureEventsAsync(string epcisDocumentJson, CancellationToken cancellationToken = default)
    {
        var content = new StringContent(epcisDocumentJson, Encoding.UTF8, "application/json");
        try
        {
            return await httpClient.PostAsync($"{_baseUrl}/events", content, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex, "EPCIS repository unavailable");
            return new HttpResponseMessage(System.Net.HttpStatusCode.ServiceUnavailable);
        }
    }

    public async Task<string> QueryEventsAsync(string queryString, CancellationToken cancellationToken = default)
    {
        var url = string.IsNullOrEmpty(queryString) ? $"{_baseUrl}/events" : $"{_baseUrl}/events?{queryString}";
        var response = await httpClient.GetAsync(url, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync(cancellationToken);
    }
}
