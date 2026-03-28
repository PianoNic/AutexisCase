import { Clock } from 'lucide-react'
import type { ShelfLifePredictionDto } from '@/api/models/ShelfLifePredictionDto'

const IMPACT_COLORS: Record<string, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
}

export function ShelfLifeCard({ prediction }: { prediction: ShelfLifePredictionDto }) {
  return (
    <div className="rounded-xl border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber-500" />
        <span className="text-xs font-semibold flex-1">Haltbarkeitsprognose</span>
        <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-700">
          {Math.round((prediction.confidence ?? 0) * 100)}% Konfidenz
        </span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold">{prediction.predictedDaysRemaining}</span>
        <span className="text-xs text-muted-foreground">Tage verbleibend</span>
      </div>

      <div className="space-y-1">
        {(prediction.riskFactors ?? []).map((rf) => (
          <div key={rf.id} className="flex items-center gap-2 text-xs">
            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${IMPACT_COLORS[rf.impact ?? 'low']}`} />
            <span className="text-muted-foreground">{rf.factor}</span>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
        {prediction.recommendation}
      </p>
    </div>
  )
}
