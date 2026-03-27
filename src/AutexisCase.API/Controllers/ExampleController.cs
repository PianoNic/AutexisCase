using AutexisCase.Application.Commands;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Queries;
using Mediator;
using Microsoft.AspNetCore.Mvc;

namespace AutexisCase.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExampleController(IMediator mediator) : ControllerBase
{
    [HttpGet(Name = "GetExamples")]
    [ProducesResponseType(typeof(List<ExampleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAsync(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetExamplesQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost(Name = "CreateExample")]
    [ProducesResponseType(typeof(ExampleDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAsync(CreateExampleCommand command, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return CreatedAtRoute("GetExamples", result);
    }
}
