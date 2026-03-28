using AutexisCase.Application.Interfaces;

namespace AutexisCase.Tests.Helpers;

public class StubCurrentUserService : ICurrentUserService
{
    public string? ExternalId { get; set; } = "test-external-id";
    public string? Email { get; set; } = "test@example.com";
    public string? DisplayName { get; set; } = "Test User";
    public bool IsAuthenticated { get; set; } = true;
}
