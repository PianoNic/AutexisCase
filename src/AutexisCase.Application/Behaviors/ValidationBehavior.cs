using FluentValidation;
using Mediator;

namespace AutexisCase.Application.Behaviors;

public sealed class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IMessage
{
    public async ValueTask<TResponse> Handle(TRequest message, MessageHandlerDelegate<TRequest, TResponse> next, CancellationToken cancellationToken)
    {
        if (!validators.Any()) return await next(message, cancellationToken);

        var context = new ValidationContext<TRequest>(message);
        var failures = (await Task.WhenAll(validators.Select(v => v.ValidateAsync(context, cancellationToken))))
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Count != 0) throw new ValidationException(failures);

        return await next(message, cancellationToken);
    }
}
