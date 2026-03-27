using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Queries;
using Mediator;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductController(IMediator mediator, IAppDbContext dbContext) : ControllerBase
{
    [HttpGet(Name = "GetProducts")]
    [ProducesResponseType(typeof(List<ProductSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var products = await mediator.Send(new GetProductsQuery(), cancellationToken);
        return Ok(products);
    }

    [HttpGet("{id:guid}", Name = "GetProductById")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var product = await mediator.Send(new GetProductByIdQuery(id), cancellationToken);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpGet("gtin/{gtin}", Name = "GetProductByGtin")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByGtin(string gtin, CancellationToken cancellationToken)
    {
        var product = await mediator.Send(new GetProductByGtinQuery(gtin), cancellationToken);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpGet("{id:guid}/journey", Name = "GetProductJourney")]
    [ProducesResponseType(typeof(List<JourneyEventDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetJourney(Guid id, CancellationToken cancellationToken)
    {
        var events = await dbContext.JourneyEvents
            .AsNoTracking()
            .Where(j => j.ProductId == id)
            .OrderBy(j => j.Timestamp)
            .Select(j => new JourneyEventDto(j.Id, j.Step, j.Location, j.Latitude, j.Longitude, j.Timestamp, j.Status, j.Icon, j.Temperature, j.Details, j.Co2Kg, j.WaterLiters, j.Cost))
            .ToListAsync(cancellationToken);

        return events.Count == 0 ? NotFound() : Ok(events);
    }

    [HttpGet("{id:guid}/coordinates", Name = "GetProductCoordinates")]
    [ProducesResponseType(typeof(JourneyCoordinatesDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCoordinates(Guid id, CancellationToken cancellationToken)
    {
        var coords = await dbContext.JourneyEvents
            .AsNoTracking()
            .Where(j => j.ProductId == id)
            .OrderBy(j => j.Timestamp)
            .Select(j => new CoordinateDto(j.Step, j.Location, j.Latitude, j.Longitude, (int)j.Status))
            .ToListAsync(cancellationToken);

        return coords.Count == 0 ? NotFound() : Ok(new JourneyCoordinatesDto(id, coords));
    }
}
