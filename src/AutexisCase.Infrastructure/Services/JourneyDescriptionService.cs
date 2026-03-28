using AutexisCase.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace AutexisCase.Infrastructure.Services;

public class JourneyDescriptionService : IJourneyDescriptionService
{
    private readonly IChatCompletionService _chat;

    public JourneyDescriptionService(IConfiguration configuration)
    {
        var apiKey = configuration["OpenRouter:ApiKey"] ?? throw new InvalidOperationException("OpenRouter:ApiKey not configured");
        var model = configuration["OpenRouter:Model"] ?? "google/gemini-2.0-flash-001";

        var builder = Kernel.CreateBuilder();
        builder.AddOpenAIChatCompletion(
            modelId: model,
            apiKey: apiKey,
            endpoint: new Uri("https://openrouter.ai/api/v1")
        );
        var kernel = builder.Build();
        _chat = kernel.GetRequiredService<IChatCompletionService>();
    }

    public async Task<string> GenerateDescriptionAsync(string productName, string step, string location, decimal? temperature, string? previousStep, CancellationToken cancellationToken = default)
    {
        var history = new ChatHistory();
        history.AddSystemMessage("""
            Du bist ein Experte für Lebensmittel-Lieferketten. Beschreibe in 2-3 kurzen, informativen Sätzen auf Deutsch,
            was bei diesem Schritt der Lieferkette passiert ist. Sei konkret und sachlich.
            Antworte nur mit dem Beschreibungstext, ohne Anführungszeichen oder Formatierung.
            """);

        var tempInfo = temperature.HasValue ? $"Die Temperatur betrug {temperature}°C." : "";
        var prevInfo = !string.IsNullOrEmpty(previousStep) ? $"Der vorherige Schritt war: {previousStep}." : "";

        history.AddUserMessage($"""
            Produkt: {productName}
            Schritt: {step}
            Ort: {location}
            {tempInfo}
            {prevInfo}
            """);

        var response = await _chat.GetChatMessageContentAsync(history, cancellationToken: cancellationToken);
        return response.Content?.Trim() ?? "Keine Beschreibung verfügbar.";
    }
}
