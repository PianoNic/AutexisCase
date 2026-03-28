import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ScanLine, Award } from 'lucide-react'
import { scanApi } from '@/api/client'
import type { ScanRecordDto } from '@/api/models/ScanRecordDto'
import type { AlertDto } from '@/api/models/AlertDto'

const severityDot: Record<number, string> = {
  0: 'bg-blue-500',
  1: 'bg-amber-500',
  2: 'bg-red-500',
}

export default function HomeScreen() {
  const navigate = useNavigate()
  const [scans, setScans] = useState<ScanRecordDto[]>([])
  const [alerts, setAlerts] = useState<AlertDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      scanApi.getRecentScans().catch(() => []),
      scanApi.getMyAlerts().catch(() => []),
    ]).then(([s, a]) => {
      setScans(s)
      setAlerts(a.filter((al) => !al.read))
      setLoading(false)
    })
  }, [])

  const okCount = scans.filter((s) => s.productStatus === 0).length

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="px-4 pt-12 pb-2 shrink-0">
        <p className="text-sm text-muted-foreground">
          {new Date().getHours() < 12 ? 'Guten Morgen' : new Date().getHours() < 18 ? 'Guten Tag' : 'Guten Abend'}
        </p>
        <h1 className="text-xl font-bold tracking-tight">Track my Food</h1>
      </div>

      <div className="px-4 space-y-4 shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border p-2.5 text-center">
            <ScanLine className="h-3.5 w-3.5 mx-auto mb-0.5 text-primary" />
            <p className="text-lg font-bold">{scans.length}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Produkte gescannt</p>
          </div>
          <div className="rounded-xl border p-2.5 text-center">
            <Award className="h-3.5 w-3.5 mx-auto mb-0.5 text-emerald-500" />
            <p className="text-lg font-bold">{okCount}/{scans.length}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Ohne Probleme</p>
          </div>
        </div>

        {alerts.length > 0 && (
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Hinweise</p>
            <div className="rounded-xl border divide-y">
              {alerts.map((a) => (
                <button
                  key={a.id}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-accent transition-colors"
                >
                  <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${severityDot[a.severity ?? 0]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-[10px] text-amber-600 truncate">{a.description}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <section className="px-4 pt-4 pb-20 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Letzte Scans</p>
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-8">Laden...</p>
        ) : scans.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Noch keine Scans. Scanne ein Produkt!</p>
        ) : (
          <>
            <div className="rounded-xl border divide-y">
              {scans.slice(0, 3).map((s) => (
                <button
                  key={s.id}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-accent transition-colors"
                  onClick={() => navigate(`/product?id=${s.productId}`)}
                >
                  {s.productImageUrl && (
                    <img src={s.productImageUrl} alt={s.productName ?? ''} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.productName}</p>
                    <p className="text-[10px] text-muted-foreground">{s.productBrand}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
            {scans.length > 3 && (
              <button
                onClick={() => navigate('/history')}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium text-primary active:bg-accent transition-colors"
              >
                Alle {scans.length} Scans anzeigen
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </section>
    </div>
  )
}
