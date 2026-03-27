using System.Security.Claims;
using AutexisCase.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace AutexisCase.Infrastructure.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public string? ExternalId => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? httpContextAccessor.HttpContext?.User.FindFirstValue("sub");
    public string? Email => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Email) ?? httpContextAccessor.HttpContext?.User.FindFirstValue("email");
    public string? DisplayName => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Name) ?? httpContextAccessor.HttpContext?.User.FindFirstValue("name");
    public bool IsAuthenticated => httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;
}
