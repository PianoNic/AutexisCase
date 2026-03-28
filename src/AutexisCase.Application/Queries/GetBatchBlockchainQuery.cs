using System.Security.Cryptography;
using System.Text;
using AutexisCase.Application.Behaviors;
using AutexisCase.Application.Dtos;
using AutexisCase.Application.Interfaces;
using AutexisCase.Application.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace AutexisCase.Application.Queries;

[AllowAuthenticated]
public record GetBatchBlockchainQuery(Guid BatchId) : IQuery<Result<BlockchainDto>>;

public class GetBatchBlockchainHandler(IAppDbContext dbContext) : IQueryHandler<GetBatchBlockchainQuery, Result<BlockchainDto>>
{
    public async ValueTask<Result<BlockchainDto>> Handle(GetBatchBlockchainQuery request, CancellationToken cancellationToken)
    {
        var batch = await dbContext.Batches.AsNoTracking()
            .Include(b => b.Product)
            .Include(b => b.JourneyEvents.OrderBy(j => j.Timestamp))
            .SingleOrDefaultAsync(b => b.Id == request.BatchId, cancellationToken);

        if (batch is null) return Result.Failure<BlockchainDto>("Batch not found.");

        var blocks = new List<BlockDto>();
        var previousHash = "0000000000000000000000000000000000000000000000000000000000000000";

        foreach (var (journeyEvent, index) in batch.JourneyEvents.Select((e, i) => (e, i)))
        {
            var data = $"{index}|{previousHash}|{journeyEvent.Timestamp:O}|{journeyEvent.Step}|{journeyEvent.Location}|{journeyEvent.Latitude}|{journeyEvent.Longitude}|{journeyEvent.Temperature}";
            var hash = ComputeHash(data);

            blocks.Add(new BlockDto(
                Index: index,
                Hash: hash,
                PreviousHash: previousHash,
                Timestamp: journeyEvent.Timestamp,
                Step: journeyEvent.Step,
                Location: journeyEvent.Location,
                Carrier: journeyEvent.Details ?? journeyEvent.Step,
                Temperature: journeyEvent.Temperature,
                IsValid: true
            ));

            previousHash = hash;
        }

        // Verify chain: each block's PreviousHash must match the preceding block's Hash
        var chainValid = true;
        for (var i = 1; i < blocks.Count; i++)
        {
            if (blocks[i].PreviousHash != blocks[i - 1].Hash)
            {
                chainValid = false;
                break;
            }
        }

        return Result.Success(new BlockchainDto(
            BatchId: batch.Id,
            LotNumber: batch.LotNumber,
            Gtin: batch.Product.Gtin,
            Blocks: blocks,
            ChainValid: chainValid
        ));
    }

    private static string ComputeHash(string data)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(data));
        return Convert.ToHexStringLower(bytes);
    }
}
