using AutexisCase.Application.Commands;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Queries;
using Mediator;
using Microsoft.AspNetCore.Mvc;

namespace AutexisCase.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScanController(IMediator mediator) : ControllerBase
{
    [HttpPost("{gtin}", Name = "RecordScan")]
    [ProducesResponseType(typeof(ScanRecordDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecordScan(string gtin, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new RecordScanCommand(gtin), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("recent", Name = "GetRecentScans")]
    [ProducesResponseType(typeof(List<ScanRecordDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRecentScans(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetRecentScansQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("alerts", Name = "GetMyAlerts")]
    [ProducesResponseType(typeof(List<AlertDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyAlerts(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetMyAlertsQuery(), cancellationToken);
        return Ok(result);
    }
}
