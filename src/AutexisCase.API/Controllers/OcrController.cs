using AutexisCase.Application.Commands;
using AutexisCase.Application.Dtos;
using Mediator;
using Microsoft.AspNetCore.Mvc;

namespace AutexisCase.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OcrController(IMediator mediator) : ControllerBase
{
    [HttpPost("lot", Name = "ExtractLotNumber")]
    [ProducesResponseType(typeof(OcrResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ExtractLot(IFormFile image, CancellationToken cancellationToken)
    {
        if (image.Length == 0) return BadRequest("No image provided");

        using var ms = new MemoryStream();
        await image.CopyToAsync(ms, cancellationToken);

        var result = await mediator.Send(new ExtractLotCommand(ms.ToArray()), cancellationToken);
        return Ok(result.Value);
    }
}
