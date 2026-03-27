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
}
