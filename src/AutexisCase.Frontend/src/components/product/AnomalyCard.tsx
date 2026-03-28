import { Activity, CheckCircle2 } from 'lucide-react'
import type { AnomalyDetectionResultDto } from '@/api/models/AnomalyDetectionResultDto'

const SEVERITY_STYLES: Record<string, string> = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
}

const SEVERITY_LABELS: Record<string, string> = {
  info: 'Info',
  warning: 'Warnung',
  critical: 'Kritisch',
}

const RISK_COLORS: Record<string, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
}

export function AnomalyCard({ result }: { result: AnomalyDetectionResultDto }) {
  const hasAnomalies = (result.anomalies?.length ?? 0) > 0

  return (
    <div className="rounded-xl border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-violet-500" />
        <span className="text-xs font-semibold flex-1">Anomalie-Erkennung</span>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${RISK_COLORS[result.overallRisk ?? 'low']}`}
              style={{ width: `${result.chainIntegrityScore}%` }}
            />
          </div>
          <span className="text-[10px] font-medium">{result.chainIntegrityScore}/100</span>
        </div>
      </div>

      {!hasAnomalies ? (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <p className="text-[11px] text-emerald-700 font-medium">Keine Anomalien erkannt</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(result.anomalies ?? []).map((a) => (
            <div key={a.id} className={`rounded-lg border p-2.5 space-y-1 ${SEVERITY_STYLES[a.severity ?? 'warning']}`}>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${SEVERITY_STYLES[a.severity ?? 'warning']}`}>
                  {SEVERITY_LABELS[a.severity ?? 'warning']}
                </span>
                <span className="text-[10px]">{a.duration}</span>
              </div>
              <p className="text-xs font-medium">{a.title}</p>
              <p className="text-[10px]">{a.description}</p>
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[10px]">{a.minTemp}°C – {a.maxTemp}°C</span>
                <span className="text-[10px] font-medium">Qualitätseinbuße: ~{a.affectedQualityPercent}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
