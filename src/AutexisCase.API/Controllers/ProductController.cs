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
        return Ok(result.Value);
    }

    [HttpGet("{id:guid}", Name = "GetProductById")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetProductByIdQuery(id), cancellationToken);
        if (result.IsFailure) return NotFound(result.Error);
        return Ok(result.Value);
    }

    [HttpGet("gtin/{gtin}", Name = "GetProductByGtin")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByGtin(string gtin, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetProductByGtinQuery(gtin), cancellationToken);
        if (result.IsFailure) return NotFound(result.Error);
        return Ok(result.Value);
    }

    [HttpGet("batch/{batchId:guid}", Name = "GetBatchById")]
    [ProducesResponseType(typeof(BatchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBatchById(Guid batchId, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetBatchByIdQuery(batchId), cancellationToken);
        if (result.IsFailure) return NotFound(result.Error);
        return Ok(result.Value);
    }

    [HttpGet("batch/lookup", Name = "LookupBatch")]
    [ProducesResponseType(typeof(BatchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> LookupBatch([FromQuery] string gtin, [FromQuery] string lot, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new LookupBatchQuery(gtin, lot), cancellationToken);
        if (result.IsFailure) return NotFound(result.Error);
        return Ok(result.Value);
    }

    [HttpGet("{id:guid}/journey", Name = "GetProductJourney")]
    [ProducesResponseType(typeof(List<JourneyEventDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetJourney(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetProductJourneyQuery(id), cancellationToken);
        return Ok(result.Value);
    }

    [HttpGet("{id:guid}/coordinates", Name = "GetProductCoordinates")]
    [ProducesResponseType(typeof(JourneyCoordinatesDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCoordinates(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetProductCoordinatesQuery(id), cancellationToken);
        return Ok(result.Value);
    }

    [HttpGet("batch/{batchId:guid}/route", Name = "GetBatchRoute")]
    [ProducesResponseType(typeof(RouteDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBatchRoute(Guid batchId, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetBatchRouteQuery(batchId), cancellationToken);
        if (result.IsFailure) return NotFound(result.Error);
        return Ok(result.Value);
    }

    [HttpGet("batch/{batchId:guid}/blockchain", Name = "GetBatchBlockchain")]
    [ProducesResponseType(typeof(BlockchainDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBatchBlockchain(Guid batchId, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetBatchBlockchainQuery(batchId), cancellationToken);
        if (result.IsFailure) return NotFound(result.Error);
        return Ok(result.Value);
    }

    [HttpGet("route", Name = "GetPointToPointRoute")]
    [ProducesResponseType(typeof(PointToPointRouteDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRoute([FromQuery] double fromLat, [FromQuery] double fromLon, [FromQuery] double toLat, [FromQuery] double toLon, [FromQuery] string profile = "driving-hgv", CancellationToken cancellationToken = default)
    {
        var result = await mediator.Send(new GetPointToPointRouteQuery(fromLat, fromLon, toLat, toLon, profile), cancellationToken);
        return Ok(result.Value);
    }
}
