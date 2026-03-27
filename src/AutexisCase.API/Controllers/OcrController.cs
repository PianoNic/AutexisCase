using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AutexisCase.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OcrController(IOcrService ocrService) : ControllerBase
{
    [HttpPost("lot", Name = "ExtractLotNumber")]
    [ProducesResponseType(typeof(OcrResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ExtractLot(IFormFile image, CancellationToken cancellationToken)
    {
        if (image.Length == 0) return BadRequest("No image provided");

        using var ms = new MemoryStream();
        await image.CopyToAsync(ms, cancellationToken);

        var (lotNumber, _) = await ocrService.ExtractLotNumberAsync(ms.ToArray());
        return Ok(new OcrResultDto(lotNumber, lotNumber is not null));
    }
}
