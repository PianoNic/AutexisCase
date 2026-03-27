using System.Text.Json;
using AutexisCase.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace AutexisCase.Infrastructure.Services;

public class OcrService : IOcrService
{
    private readonly IChatCompletionService _chat;

    public OcrService(IConfiguration configuration)
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

    public async Task<(string? LotNumber, string FullText)> ExtractLotNumberAsync(byte[] imageBytes)
    {
        var base64 = Convert.ToBase64String(imageBytes);
        var mimeType = "image/jpeg";

        var history = new ChatHistory();
        history.AddSystemMessage("""
            You are a food packaging OCR assistant. Extract information from product packaging images.
            Always respond with valid JSON only, no markdown, no explanation.
            """);

        var message = new ChatMessageContentItemCollection
        {
            new TextContent("""
                Extract the LOT/batch/charge number from this food packaging image.
                Look for text like "LOT", "BATCH", "CHARGE", "L:", or any alphanumeric code near an expiry date.

                Respond with this exact JSON format:
                {"lotNumber": "THE_LOT_NUMBER", "expiryDate": "DD.MM.YYYY or null", "allText": "all visible text"}

                If no LOT number is found, set lotNumber to null.
                """),
            new ImageContent(Convert.FromBase64String(base64), mimeType),
        };

        history.AddUserMessage(message);

        var response = await _chat.GetChatMessageContentAsync(history);
        var responseText = response.Content ?? "";

        try
        {
            // Clean response — remove markdown code blocks if present
            var json = responseText.Trim();
            if (json.StartsWith("```")) json = json.Split('\n', 2).Length > 1 ? json.Split('\n', 2)[1] : json;
            if (json.EndsWith("```")) json = json[..^3];
            json = json.Trim();

            var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var lotNumber = root.TryGetProperty("lotNumber", out var lot) && lot.ValueKind == JsonValueKind.String ? lot.GetString() : null;
            var allText = root.TryGetProperty("allText", out var text) && text.ValueKind == JsonValueKind.String ? text.GetString() ?? "" : "";

            return (lotNumber, allText);
        }
        catch
        {
            return (null, responseText);
        }
    }
}
