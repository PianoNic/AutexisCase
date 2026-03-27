namespace AutexisCase.Application.Interfaces;

public interface IOcrService
{
    Task<(string? LotNumber, string FullText)> ExtractLotNumberAsync(byte[] imageBytes);
}
