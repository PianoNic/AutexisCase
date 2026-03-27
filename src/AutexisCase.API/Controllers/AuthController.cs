using System.Net.Http.Headers;
using System.Text.Json;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AutexisCase.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(ICurrentUserService currentUserService, IUserSyncService userSyncService, IHttpClientFactory httpClientFactory, IConfiguration configuration) : ControllerBase
{
    [HttpPost("sync", Name = "SyncUser")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SyncAsync(CancellationToken cancellationToken)
    {
        if (currentUserService.ExternalId is null)
            return Unauthorized();

        string email = currentUserService.Email ?? string.Empty;
        string displayName = currentUserService.DisplayName ?? string.Empty;
        string? avatarUrl = null;

        var userInfo = await FetchUserInfoAsync(cancellationToken);
        if (userInfo is not null)
        {
            if (string.IsNullOrEmpty(email)) email = userInfo.Email ?? $"{currentUserService.ExternalId}@unknown";
            if (string.IsNullOrEmpty(displayName)) displayName = userInfo.Name ?? email;
            avatarUrl = userInfo.Picture;
        }

        var user = await userSyncService.SyncUserAsync(currentUserService.ExternalId, email, displayName, avatarUrl, cancellationToken);
        return Ok(new UserDto(user.Id, user.ExternalId, user.Email, user.DisplayName, user.AvatarUrl));
    }

    private async Task<OidcUserInfo?> FetchUserInfoAsync(CancellationToken cancellationToken)
    {
        string? authority = configuration["Oidc:Authority"];
        if (string.IsNullOrEmpty(authority)) return null;

        string? accessToken = HttpContext.Request.Headers.Authorization.ToString().Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase).Trim();
        if (string.IsNullOrEmpty(accessToken)) return null;

        var client = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, $"{authority.TrimEnd('/')}/api/oidc/userinfo");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        return JsonSerializer.Deserialize<OidcUserInfo>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    private record OidcUserInfo(string? Sub, string? Email, string? Name, string? Picture);
}
