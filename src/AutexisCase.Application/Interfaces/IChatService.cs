namespace AutexisCase.Application.Interfaces;

public interface IChatService
{
    Task<string> AskAsync(string question, string productContext, CancellationToken cancellationToken = default);
}
