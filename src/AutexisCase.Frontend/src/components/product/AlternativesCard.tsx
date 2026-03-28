import type { ProductAlternativesDto } from '@/api/models/ProductAlternativesDto'

export function AlternativesCard({ data }: { data: ProductAlternativesDto }) {
  if (!data.alternatives?.length) return null

  return (
    <section>
      <p className="text-sm font-semibold mb-2">Alternativen</p>
      <div className="space-y-2">
        {data.alternatives.map((alt) => (
          <div key={alt.id} className="flex items-center gap-3 rounded-xl border px-3 py-2">
            {alt.imageUrl && (
              <img src={alt.imageUrl} alt={alt.name ?? ""} className="h-10 w-10 rounded-lg object-cover shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{alt.name}</p>
              <p className="text-[10px] text-muted-foreground">{alt.brand} · {alt.co2Kg} kg CO₂</p>
            </div>
            <div className="flex flex-wrap gap-1 shrink-0">
              {(alt.improvementTags ?? []).slice(0, 2).map((tag) => (
                <span key={tag} className="rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9px] text-emerald-700 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
