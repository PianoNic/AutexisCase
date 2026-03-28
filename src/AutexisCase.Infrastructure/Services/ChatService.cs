using AutexisCase.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace AutexisCase.Infrastructure.Services;

public class ChatService : IChatService
{
    private readonly IChatCompletionService _chat;

    public ChatService(IConfiguration configuration)
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

    public async Task<string> AskAsync(string question, string productContext, CancellationToken cancellationToken = default)
    {
        var history = new ChatHistory();
        history.AddSystemMessage($"""
            Du bist ein hilfreicher Produktberater für Lebensmittel. Du beantwortest Fragen basierend auf den folgenden Produktdaten.
            Antworte immer auf Deutsch, kurz und präzise. Wenn du etwas nicht aus den Daten beantworten kannst, sage es ehrlich.

            --- PRODUKTDATEN ---
            {productContext}
            --- ENDE PRODUKTDATEN ---
            """);
        history.AddUserMessage(question);

        var response = await _chat.GetChatMessageContentAsync(history, cancellationToken: cancellationToken);
        return response.Content ?? "Entschuldigung, ich konnte keine Antwort generieren.";
    }
}
