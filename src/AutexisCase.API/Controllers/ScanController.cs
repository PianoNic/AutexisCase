using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Domain;
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
        var product = await dbContext.Products.FirstOrDefaultAsync(p => p.Gtin == gtin, cancellationToken);
        if (product is null) return NotFound();

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalId == currentUserService.ExternalId, cancellationToken);
        if (user is null) return Unauthorized();

        var scan = new ScanRecord { UserId = user.Id, ProductId = product.Id, ScannedAt = DateTime.UtcNow };
        dbContext.ScanRecords.Add(scan);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new ScanRecordDto(scan.Id, product.Id, product.Name, product.Brand, product.ImageUrl, product.Status, scan.ScannedAt));
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
            .Include(s => s.Product)
            .Select(s => new ScanRecordDto(s.Id, s.ProductId, s.Product.Name, s.Product.Brand, s.Product.ImageUrl, s.Product.Status, s.ScannedAt))
            .ToListAsync(cancellationToken);

        return Ok(scans);
    }
}
