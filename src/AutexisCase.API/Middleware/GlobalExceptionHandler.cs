using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace AutexisCase.API.Middleware;

public class GlobalExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (statusCode, title) = exception switch
        {
            ValidationException => (StatusCodes.Status400BadRequest, "Validation Error"),
            UnauthorizedAccessException => (StatusCodes.Status403Forbidden, "Forbidden"),
            KeyNotFoundException => (StatusCodes.Status404NotFound, "Not Found"),
            _ => (StatusCodes.Status500InternalServerError, "Internal Server Error")
        };

        httpContext.Response.StatusCode = statusCode;
        await httpContext.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = exception.Message
        }, cancellationToken);

        return true;
    }
}
