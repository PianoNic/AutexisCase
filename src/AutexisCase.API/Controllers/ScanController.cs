using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Domain;
using AutexisCase.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScanController(IAppDbContext dbContext, ICurrentUserService currentUserService) : ControllerBase
{
    [HttpPost("{gtin}", Name = "RecordScan")]
    [ProducesResponseType(typeof(ScanRecordDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecordScan(string gtin, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products.Include(p => p.Batches).FirstOrDefaultAsync(p => p.Gtin == gtin, cancellationToken);
        if (product is null) return NotFound();

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalId == currentUserService.ExternalId, cancellationToken);
        if (user is null) return Unauthorized();

        var scan = new ScanRecord { UserId = user.Id, ProductId = product.Id, ScannedAt = DateTime.UtcNow };
        dbContext.ScanRecords.Add(scan);
        await dbContext.SaveChangesAsync(cancellationToken);

        var worstStatus = product.Batches.Count > 0
            ? product.Batches.Max(b => b.Status)
            : ProductStatus.Ok;

        return Ok(new ScanRecordDto(scan.Id, product.Id, product.Name, product.Brand, product.ImageUrl, worstStatus, scan.ScannedAt));
    }

    [HttpGet("recent", Name = "GetRecentScans")]
    [ProducesResponseType(typeof(List<ScanRecordDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRecentScans(CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalId == currentUserService.ExternalId, cancellationToken);
        if (user is null) return Ok(new List<ScanRecordDto>());

        var scans = await dbContext.ScanRecords
            .AsNoTracking()
            .Where(s => s.UserId == user.Id)
            .OrderByDescending(s => s.ScannedAt)
            .Take(20)
            .Include(s => s.Product).ThenInclude(p => p.Batches)
            .ToListAsync(cancellationToken);

        return Ok(scans.Select(s =>
        {
            var worstStatus = s.Product.Batches.Count > 0
                ? s.Product.Batches.Max(b => b.Status)
                : ProductStatus.Ok;
            return new ScanRecordDto(s.Id, s.ProductId, s.Product.Name, s.Product.Brand, s.Product.ImageUrl, worstStatus, s.ScannedAt);
        }).ToList());
    }

    [HttpGet("alerts", Name = "GetMyAlerts")]
    [ProducesResponseType(typeof(List<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyAlerts(CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalId == currentUserService.ExternalId, cancellationToken);
        if (user is null) return Ok(new List<object>());

        var scannedProductIds = await dbContext.ScanRecords
            .AsNoTracking()
            .Where(s => s.UserId == user.Id)
            .Select(s => s.ProductId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var alerts = await dbContext.Alerts
            .AsNoTracking()
            .Where(a => scannedProductIds.Contains(a.Batch.ProductId))
            .OrderByDescending(a => a.Timestamp)
            .Select(a => new { a.Id, a.Type, a.Severity, a.Title, a.Description, a.Timestamp, a.Read, ProductId = a.Batch.ProductId })
            .ToListAsync(cancellationToken);

        return Ok(alerts);
    }
}
