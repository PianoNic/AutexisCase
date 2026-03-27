using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using Mediator;

namespace AutexisCase.Application.Commands;

[AllowAuthenticated]
public record ExtractLotCommand(byte[] ImageData) : ICommand<Result<OcrResultDto>>;

public class ExtractLotHandler(IOcrService ocrService) : ICommandHandler<ExtractLotCommand, Result<OcrResultDto>>
{
    public async ValueTask<Result<OcrResultDto>> Handle(ExtractLotCommand request, CancellationToken cancellationToken)
    {
        var (lotNumber, _) = await ocrService.ExtractLotNumberAsync(request.ImageData);
        return Result.Success(new OcrResultDto(lotNumber, lotNumber is not null));
    }
}
