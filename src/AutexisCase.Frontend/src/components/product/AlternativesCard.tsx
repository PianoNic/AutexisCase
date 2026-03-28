import type { ProductAlternativesDto } from '@/api/models/ProductAlternativesDto'

export function AlternativesCard({ data }: { data: ProductAlternativesDto }) {
  if (!data.alternatives?.length) return null

  return (
    <section>
      <p className="text-sm font-semibold mb-2">Alternativen</p>
      <div className="space-y-2">
        {data.alternatives.map((alt) => (
          <div key={alt.id} className="rounded-xl border px-3 py-2.5 space-y-1.5">
            <div className="flex items-center gap-3">
              {alt.imageUrl ? (
                <img src={alt.imageUrl} alt={alt.name ?? ""} className="h-10 w-10 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">{(alt.name ?? "?")[0]}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{alt.name}</p>
                <p className="text-[10px] text-muted-foreground">{alt.brand} · {alt.co2Kg} kg CO₂</p>
              </div>
            </div>
            {(alt.improvementTags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {(alt.improvementTags ?? []).map((tag) => (
                  <span key={tag} className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] text-emerald-700 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
