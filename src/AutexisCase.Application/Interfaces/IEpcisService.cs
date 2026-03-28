namespace AutexisCase.Application.Interfaces;

public interface IEpcisService
{
    Task<HttpResponseMessage> CaptureEventsAsync(string epcisDocumentJson, CancellationToken cancellationToken = default);
    Task<string> QueryEventsAsync(string queryString, CancellationToken cancellationToken = default);
}
