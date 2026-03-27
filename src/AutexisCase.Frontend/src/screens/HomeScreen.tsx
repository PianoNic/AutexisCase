import { useNavigate } from 'react-router-dom'
import { ChevronRight, ScanLine, Award } from 'lucide-react'
import { scanHistory, globalAlerts } from '@/data/mock'

const nutriColors: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-lime-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-500',
}

const severityDot: Record<string, string> = {
  Critical: 'bg-red-500',
  Warning: 'bg-amber-500',
  Info: 'bg-blue-500',
}

export default function HomeScreen() {
  const navigate = useNavigate()
  const activeAlerts = globalAlerts.filter((a) => !a.read)
  const bioCount = scanHistory.filter((s) => s.nutriScore === 'A').length

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 pt-12 pb-2 shrink-0">
        <p className="text-sm text-muted-foreground">
          {new Date().getHours() < 12 ? 'Guten Morgen' : new Date().getHours() < 18 ? 'Guten Tag' : 'Guten Abend'}
        </p>
        <h1 className="text-xl font-bold tracking-tight">Track my Food</h1>
      </div>

      <div className="px-4 space-y-4 shrink-0">
        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border p-2.5 text-center">
            <ScanLine className="h-3.5 w-3.5 mx-auto mb-0.5 text-primary" />
            <p className="text-lg font-bold">{scanHistory.length}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Produkte gescannt</p>
          </div>
          <div className="rounded-xl border p-2.5 text-center">
            <Award className="h-3.5 w-3.5 mx-auto mb-0.5 text-emerald-500" />
            <p className="text-lg font-bold">
              {bioCount}/{scanHistory.length}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight">Nutri-Score A</p>
          </div>
        </div>

        {/* Alerts */}
        {activeAlerts.length > 0 && (
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Hinweise</p>
            <div className="rounded-xl border divide-y">
              {activeAlerts.map((a) => {
                const productId = a.productName.includes('Tomaten')
                  ? 'tomatoes'
                  : a.productName.includes('Zartbitter')
                    ? 'chocolate'
                    : undefined
                return (
                  <button
                    key={a.id}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-accent transition-colors"
                    onClick={() => productId && navigate(`/product/${productId}`)}
                  >
                    <div className="relative">
                      <img
                        src={a.productImage}
                        alt={a.productName}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                      <div
                        className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${severityDot[a.severity]}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{a.productName}</p>
                      <p className="text-[10px] text-amber-600 truncate">{a.title}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* Scan history — fills remaining height */}
      <section className="flex-1 min-h-0 flex flex-col px-4 pt-4 pb-20">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 shrink-0">Letzte Scans</p>
        <div className="rounded-xl border divide-y overflow-y-auto">
          {scanHistory.map((s) => {
            const productId = s.id === 'tomatoes' || s.id === 'chocolate' ? s.id : 'tomatoes'
            return (
              <button
                key={s.id}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-accent transition-colors"
                onClick={() => navigate(`/product/${productId}`)}
              >
                <img
                  src={s.imageUrl ?? ''}
                  alt={s.name ?? ''}
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {s.brand} · {s.category}
                  </p>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${nutriColors[s.nutriScore ?? 'C']}`}
                >
                  {s.nutriScore}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
