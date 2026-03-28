using AutexisCase.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutexisCase.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EpcisController(IEpcisService epcisService) : ControllerBase
{
    [HttpPost("events")]
    public async Task<IActionResult> CaptureEvents(CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync(cancellationToken);
        var result = await epcisService.CaptureEventsAsync(body, cancellationToken);
        return StatusCode((int)result.StatusCode);
    }

    [HttpGet("events")]
    public async Task<IActionResult> QueryEvents(CancellationToken cancellationToken)
    {
        var query = Request.QueryString.Value?.TrimStart('?') ?? "";
        var result = await epcisService.QueryEventsAsync(query, cancellationToken);
        return Content(result, "application/json");
    }
}
