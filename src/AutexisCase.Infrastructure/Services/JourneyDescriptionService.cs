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
            Du bist ein Storyteller und Experte für Lebensmittel-Lieferketten. Du schreibst für eine App,
            die Konsumenten den Weg ihres Produkts zeigt — vom Feld bis ins Regal.

            Schreibe einen spannenden, informativen Text auf Deutsch (4-6 Sätze) über diesen Lieferketten-Schritt.
            Erkläre anschaulich, was hier genau passiert, warum dieser Schritt wichtig ist, und welche
            interessanten Details der Konsument wissen sollte. Erwähne z.B.:
            - Wie das Produkt verarbeitet/transportiert/gelagert wird
            - Warum bestimmte Bedingungen (Temperatur, Hygiene) eingehalten werden müssen
            - Fun Facts oder Hintergrundwissen zur Region oder zum Prozess
            - Was diesen Schritt für die Qualität des Endprodukts bedeutet

            Schreibe lebendig und verständlich, nicht wie ein Lehrbuch. Der Ton ist informativ aber nahbar.

            Strukturiere deine Antwort so (nur Text, keine Markdown-Formatierung):

            Zuerst 2-3 Sätze was genau bei diesem Schritt passiert.
            Dann 1-2 Sätze warum das für die Qualität wichtig ist.
            Dann 1 Fun Fact oder interessantes Detail über den Ort, den Prozess oder die Region.
            Zum Schluss 1 Satz was der Konsument davon hat (z.B. Frische, Geschmack, Sicherheit).

            Insgesamt 6-8 Sätze. Nur Fliesstext, keine Aufzählungen, keine Überschriften.
            """);

        var tempInfo = temperature.HasValue ? $"Gemessene Temperatur: {temperature}°C." : "";
        var prevInfo = !string.IsNullOrEmpty(previousStep) ? $"Vorheriger Schritt war: «{previousStep}»." : "";

        history.AddUserMessage($"""
            Produkt: {productName}
            Aktueller Schritt in der Lieferkette: {step}
            Standort/Region: {location}
            {tempInfo}
            {prevInfo}

            Erzähle die Geschichte dieses Schritts für den Konsumenten.
            """);

        var response = await _chat.GetChatMessageContentAsync(history, cancellationToken: cancellationToken);
        return response.Content?.Trim() ?? "Keine Beschreibung verfügbar.";
    }

    public async Task<string> GeneratePersonalizedViewAsync(string productContext, string userPrompt, CancellationToken cancellationToken = default)
    {
        var history = new ChatHistory();
        history.AddSystemMessage("""
            Du bist ein persönlicher Lebensmittel-Berater. Der Benutzer hat definiert, was ihn an Produkten interessiert.
            Erstelle basierend auf den Produktdaten eine personalisierte Zusammenfassung auf Deutsch.

            Schreibe nur das, was den Benutzer interessiert — nichts anderes.
            Verwende einen freundlichen, informativen Ton. Formatiere mit kurzen Absätzen.
            Wenn Daten fehlen, die der Benutzer sehen möchte, erwähne das kurz.
            Antworte nur mit dem Text, ohne Markdown-Formatierung.
            """);

        history.AddUserMessage($"""
            === PRODUKTDATEN ===
            {productContext}

            === WAS MICH INTERESSIERT ===
            {userPrompt}

            Erstelle meine personalisierte Produktübersicht.
            """);

        var response = await _chat.GetChatMessageContentAsync(history, cancellationToken: cancellationToken);
        return response.Content?.Trim() ?? "Personalisierte Ansicht konnte nicht erstellt werden.";
    }
}
