using AutexisCase.Application.Dtos;
using AutexisCase.Application.Queries;
using Mediator;
using Microsoft.AspNetCore.Mvc;

namespace AutexisCase.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductController(IMediator mediator) : ControllerBase
{
    [HttpGet(Name = "GetProducts")]
    [ProducesResponseType(typeof(List<ProductSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetProductsQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}", Name = "GetProductById")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetProductByIdQuery(id), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("gtin/{gtin}", Name = "GetProductByGtin")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByGtin(string gtin, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetProductByGtinQuery(gtin), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("batch/{batchId:guid}", Name = "GetBatchById")]
    [ProducesResponseType(typeof(BatchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBatchById(Guid batchId, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetBatchByIdQuery(batchId), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("batch/lookup", Name = "LookupBatch")]
    [ProducesResponseType(typeof(BatchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> LookupBatch([FromQuery] string gtin, [FromQuery] string lot, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new LookupBatchQuery(gtin, lot), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("{id:guid}/journey", Name = "GetProductJourney")]
    [ProducesResponseType(typeof(List<JourneyEventDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetJourney(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetProductJourneyQuery(id), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}/coordinates", Name = "GetProductCoordinates")]
    [ProducesResponseType(typeof(JourneyCoordinatesDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCoordinates(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetProductCoordinatesQuery(id), cancellationToken);
        return Ok(result);
    }
}
