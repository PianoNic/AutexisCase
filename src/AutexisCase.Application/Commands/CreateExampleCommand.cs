using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Domain;
using FluentValidation;
using Mediator;

namespace AutexisCase.Application.Commands;

public record CreateExampleCommand(string Title, string? Description) : ICommand<ExampleDto>;

public class CreateExampleValidator : AbstractValidator<CreateExampleCommand>
{
    public CreateExampleValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(1000);
    }
}

public class CreateExampleHandler(IAppDbContext dbContext) : ICommandHandler<CreateExampleCommand, ExampleDto>
{
    public async ValueTask<ExampleDto> Handle(CreateExampleCommand request, CancellationToken cancellationToken)
    {
        var example = new Example
        {
            Title = request.Title,
            Description = request.Description
        };

        dbContext.Examples.Add(example);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ExampleDto(example.Id, example.Title, example.Description, example.CreatedAt);
    }
}
