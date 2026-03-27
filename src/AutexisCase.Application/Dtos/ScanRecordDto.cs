using AutexisCase.Domain.Enums;

namespace AutexisCase.Application.Dtos;

public record ScanRecordDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductBrand,
    string? ProductImageUrl,
    ProductStatus ProductStatus,
    DateTime ScannedAt
);
