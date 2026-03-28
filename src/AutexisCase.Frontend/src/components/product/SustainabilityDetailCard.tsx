import { Leaf, Truck, Package } from 'lucide-react'
import type { SustainabilityAnalysisDto } from '@/api/models/SustainabilityAnalysisDto'

const STAGE_COLORS = ['bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500', 'bg-teal-500', 'bg-indigo-500', 'bg-orange-500', 'bg-cyan-500']

const PACKAGING_COLORS: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-lime-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-500',
}

export function SustainabilityDetailCard({ analysis }: { analysis: SustainabilityAnalysisDto }) {
  const betterThanAvg = (analysis.comparisonToAverage ?? 0) < 0

  return (
    <div className="rounded-xl border p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Leaf className="h-4 w-4 text-emerald-600" />
        <span className="text-xs font-semibold flex-1">Ökologischer Fussabdruck</span>
      </div>

      {/* CO2 stacked bar */}
      {(analysis.co2Breakdown?.length ?? 0) > 0 && (
        <div className="space-y-1.5">
          <div className="flex h-3 overflow-hidden rounded-full">
            {(analysis.co2Breakdown ?? []).map((item, i) => (
              <div key={item.id} className={STAGE_COLORS[i % STAGE_COLORS.length]} style={{ width: `${item.percentage}%` }} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            {(analysis.co2Breakdown ?? []).map((item, i) => (
              <div key={item.id} className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <div className={`h-1.5 w-1.5 rounded-full ${STAGE_COLORS[i % STAGE_COLORS.length]}`} />
                  {item.stage}
                </span>
                <span className="font-medium">{item.co2Kg} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold">{analysis.totalCo2Kg} kg CO₂</span>
        <span className={`font-medium ${betterThanAvg ? 'text-emerald-600' : 'text-red-500'}`}>
          {betterThanAvg ? `${Math.abs(analysis.comparisonToAverage ?? 0)}% unter` : `${analysis.comparisonToAverage}% über`} Durchschnitt
        </span>
      </div>

      {/* Detail rows */}
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Truck className="h-3 w-3" /> Transport
          </span>
          <span className="font-medium">{(analysis.transportDistanceKm ?? 0).toLocaleString()} km</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Package className="h-3 w-3" /> Verpackung
          </span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${PACKAGING_COLORS[analysis.packagingScore ?? 'C']}`}>
            {analysis.packagingScore}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Wasserverbrauch</span>
          <span className="font-medium">{analysis.waterFootprintL} L</span>
        </div>
      </div>

      {/* Eco tips */}
      {(analysis.ecoTips?.length ?? 0) > 0 && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-2 space-y-1">
          {(analysis.ecoTips ?? []).map((tip, i) => (
            <p key={i} className="text-[10px] text-emerald-800">• {tip}</p>
          ))}
        </div>
      )}
    </div>
  )
}
