import { Leaf, Truck, Package } from 'lucide-react'
import type { SustainabilityAnalysis } from '@/types/ai-features'

const STAGE_COLORS = ['bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-violet-500']

const PACKAGING_COLORS: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-lime-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-500',
}

export function SustainabilityDetailCard({ analysis }: { analysis: SustainabilityAnalysis }) {
  const betterThanAvg = analysis.comparisonToAverage < 0

  return (
    <div className="rounded-xl border p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Leaf className="h-4 w-4 text-emerald-600" />
        <span className="text-xs font-semibold flex-1">Ökologischer Fußabdruck</span>
      </div>

      {/* CO2 stacked bar */}
      <div className="space-y-1.5">
        <div className="flex h-3 overflow-hidden rounded-full">
          {analysis.co2Breakdown.map((item, i) => (
            <div key={item.id} className={STAGE_COLORS[i % STAGE_COLORS.length]} style={{ width: `${item.percentage}%` }} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          {analysis.co2Breakdown.map((item, i) => (
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

      {/* Summary stats */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold">{analysis.totalCo2Kg} kg CO₂</span>
        <span className={`font-medium ${betterThanAvg ? 'text-emerald-600' : 'text-red-500'}`}>
          {betterThanAvg ? `${Math.abs(analysis.comparisonToAverage)}% unter` : `${analysis.comparisonToAverage}% über`} Durchschnitt
        </span>
      </div>

      {/* Detail rows */}
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Truck className="h-3 w-3" /> Transport
          </span>
          <span className="font-medium">{analysis.transportDistanceKm.toLocaleString()} km</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Package className="h-3 w-3" /> Verpackung
          </span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${PACKAGING_COLORS[analysis.packagingScore]}`}>
            {analysis.packagingScore}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Wasserverbrauch</span>
          <span className="font-medium">{analysis.waterFootprintL} L</span>
        </div>
      </div>

      {/* Badges */}
      {(analysis.seasonalityBonus || analysis.localBonus) && (
        <div className="flex flex-wrap gap-1.5">
          {analysis.seasonalityBonus && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-700 font-medium">
              Saisonal
            </span>
          )}
          {analysis.localBonus && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-700 font-medium">
              Regional
            </span>
          )}
        </div>
      )}

      {/* Eco tips */}
      {analysis.ecoTips.length > 0 && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-2 space-y-1">
          {analysis.ecoTips.map((tip, i) => (
            <p key={i} className="text-[10px] text-emerald-800">• {tip}</p>
          ))}
        </div>
      )}
    </div>
  )
}
