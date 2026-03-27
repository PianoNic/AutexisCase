using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using Mediator;

namespace AutexisCase.Application.Commands;

[AllowAuthenticated]
public record ExtractLotCommand(byte[] ImageData) : ICommand<OcrResultDto>;

public class ExtractLotHandler(IOcrService ocrService) : ICommandHandler<ExtractLotCommand, OcrResultDto>
{
    public async ValueTask<OcrResultDto> Handle(ExtractLotCommand request, CancellationToken cancellationToken)
    {
        var (lotNumber, _) = await ocrService.ExtractLotNumberAsync(request.ImageData);
        return new OcrResultDto(lotNumber, lotNumber is not null);
    }
}
