using AutexisCase.Application.Interfaces;
using AutexisCase.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AutexisCase.Infrastructure;

public static class EpcisSeedData
{
    public static async Task SeedAsync(AutexisCaseDbContext dbContext, IEpcisService epcisService, ILogger logger)
    {
        var products = await dbContext.Products
            .Include(p => p.Batches)
            .ThenInclude(b => b.JourneyEvents.OrderBy(j => j.Timestamp))
            .ToListAsync();

        foreach (var product in products)
        {
            foreach (var batch in product.Batches)
            {
                if (batch.JourneyEvents.Count == 0) continue;

                var epcisDoc = EpcisEventMapper.ToEpcisDocument(product, batch);
                var result = await epcisService.CaptureEventsAsync(epcisDoc);

                if (result.IsSuccessStatusCode)
                    logger.LogInformation("EPCIS: Seeded {Count} events for {Gtin}/{Lot}", batch.JourneyEvents.Count, product.Gtin, batch.LotNumber);
                else
                    logger.LogWarning("EPCIS: Failed to seed events for {Gtin}/{Lot} — {Status}", product.Gtin, batch.LotNumber, result.StatusCode);
            }
        }
    }
}
