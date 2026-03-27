using System.Text.RegularExpressions;
using AutexisCase.Application.Interfaces;
using OpenCvSharp;
using Sdcb.PaddleInference;
using Sdcb.PaddleOCR;
using Sdcb.PaddleOCR.Models;
using Sdcb.PaddleOCR.Models.Online;

namespace AutexisCase.Infrastructure.Services;

public class OcrService : IOcrService, IDisposable
{
    private PaddleOcrAll? _engine;
    private readonly SemaphoreSlim _initLock = new(1, 1);

    private static readonly Regex[] LotPatterns =
    [
        new(@"(?i)LOT[\s.:/#-]*([A-Z0-9\-]{3,})", RegexOptions.Compiled),
        new(@"(?i)BATCH[\s.:/#-]*([A-Z0-9\-]{3,})", RegexOptions.Compiled),
        new(@"(?i)CHARGE[\s.:/#-]*([A-Z0-9\-]{3,})", RegexOptions.Compiled),
        new(@"(?i)L[\s.:]*(\d{4,}[A-Z0-9\-]*)", RegexOptions.Compiled),
        new(@"#([A-Z]{2,3}-\d{4}-\d{3,})", RegexOptions.Compiled),
    ];

    private async Task EnsureInitializedAsync()
    {
        if (_engine is not null) return;

        await _initLock.WaitAsync();
        try
        {
            if (_engine is not null) return;
            FullOcrModel model = await OnlineFullModels.EnglishV4.DownloadAsync();
            _engine = new PaddleOcrAll(model, PaddleDevice.Mkldnn())
            {
                AllowRotateDetection = true,
                Enable180Classification = true,
            };
        }
        finally
        {
            _initLock.Release();
        }
    }

    public async Task<(string? LotNumber, string FullText)> ExtractLotNumberAsync(byte[] imageBytes)
    {
        await EnsureInitializedAsync();

        using var src = Mat.FromImageData(imageBytes, ImreadModes.Color);
        var result = _engine!.Run(src);
        var fullText = result.Text;

        foreach (var region in result.Regions)
        {
            foreach (var pattern in LotPatterns)
            {
                var match = pattern.Match(region.Text);
                if (match.Success)
                    return (match.Groups[1].Value, fullText);
            }
        }

        return (null, fullText);
    }

    public void Dispose()
    {
        _engine?.Dispose();
        _initLock.Dispose();
    }
}
