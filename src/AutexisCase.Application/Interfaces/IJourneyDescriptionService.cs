namespace AutexisCase.Application.Interfaces;

public interface IJourneyDescriptionService
{
    Task<string> GenerateDescriptionAsync(string productName, string step, string location, decimal? temperature, string? previousStep, CancellationToken cancellationToken = default);
    Task<string> GeneratePersonalizedViewAsync(string productContext, string userPrompt, CancellationToken cancellationToken = default);
}
