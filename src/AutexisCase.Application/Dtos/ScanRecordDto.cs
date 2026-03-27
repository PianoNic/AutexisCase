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

public record JourneyCoordinatesDto(
    Guid ProductId,
    List<CoordinateDto> Coordinates
);

public record CoordinateDto(
    string Step,
    string Location,
    double Latitude,
    double Longitude,
    int Status
);
