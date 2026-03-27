using AutexisCase.Application.Dtos;
using AutexisCase.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;

namespace AutexisCase.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OcrController(OcrService ocrService) : ControllerBase
{
    [HttpPost("lot", Name = "ExtractLotNumber")]
    [ProducesResponseType(typeof(OcrResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExtractLot(IFormFile image)
    {
        if (image.Length == 0) return BadRequest("No image provided");

        using var ms = new MemoryStream();
        await image.CopyToAsync(ms);

        var (lotNumber, _) = await ocrService.ExtractLotNumberAsync(ms.ToArray());
        return Ok(new OcrResultDto(lotNumber, lotNumber is not null));
    }
}
