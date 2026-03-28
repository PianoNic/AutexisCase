namespace AutexisCase.Domain;

public class EpcisEvent : BaseEntity
{
    public required string Epc { get; set; }
    public required string EventType { get; set; }
    public DateTime EventTime { get; set; }
    public required string BizStep { get; set; }
    public required string Disposition { get; set; }
    public required string ReadPoint { get; set; }
    public required string BizLocation { get; set; }
    public string Action { get; set; } = "OBSERVE";
    public string? RawJson { get; set; }
}
