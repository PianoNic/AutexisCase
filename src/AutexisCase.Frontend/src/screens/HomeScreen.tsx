import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ScanLine, Award, Package, AlertTriangle } from 'lucide-react'
import { scanApi } from '@/api/client'
import type { ScanRecordDto } from '@/api/models/ScanRecordDto'
import type { AlertDto } from '@/api/models/AlertDto'

const severityDot: Record<string, string> = {
  Info: 'bg-blue-500',
  Warning: 'bg-amber-500',
  Critical: 'bg-red-500',
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

  const okCount = scans.filter((s) => s.productStatus === 'Ok').length
  const problemScans = scans.filter((s) => s.productStatus === 'Warning' || s.productStatus === 'Recall')
  const okScans = scans.filter((s) => s.productStatus === 'Ok')

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="px-4 pt-12 pb-2 shrink-0">
        <p className="text-sm text-muted-foreground">
          {new Date().getHours() < 12 ? 'Guten Morgen' : new Date().getHours() < 18 ? 'Guten Tag' : 'Guten Abend'}
        </p>
        <h1 className="text-xl font-bold tracking-tight">Track my Food</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border p-2.5 text-center">
              <ScanLine className="h-3.5 w-3.5 mx-auto mb-0.5 text-primary" />
              <p className="text-lg font-bold">{scans.length}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Produkte gescannt</p>
            </div>
            <div className={`rounded-xl border p-2.5 text-center ${problemScans.length > 0 ? 'border-red-200 bg-red-50/50' : ''}`}>
              {problemScans.length > 0 ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 mx-auto mb-0.5 text-red-500" />
                  <p className="text-lg font-bold text-red-700">{problemScans.length}</p>
                  <p className="text-[11px] text-red-600 leading-tight">Probleme erkannt</p>
                </>
              ) : (
                <>
                  <Award className="h-3.5 w-3.5 mx-auto mb-0.5 text-emerald-500" />
                  <p className="text-lg font-bold">{okCount}/{scans.length}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">Ohne Probleme</p>
                </>
              )}
            </div>
          </div>

          {/* Critical alerts */}
          {alerts.length > 0 && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Hinweise</p>
              <div className="rounded-xl border divide-y">
                {alerts.map((a) => (
                  <button
                    key={a.id}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-accent transition-colors"
                  >
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${severityDot[a.severity as string] ?? 'bg-gray-400'}`} />
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

          {/* Problem products on top */}
          {problemScans.length > 0 && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-red-600 mb-2">Betroffene Produkte</p>
              <div className="rounded-xl border-2 border-red-200 bg-red-50/30 divide-y divide-red-100">
                {problemScans.map((s) => (
                  <button
                    key={s.id}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-red-50 transition-colors"
                    onClick={() => navigate(`/product?id=${s.productId}`)}
                  >
                    {s.productImageUrl ? (
                      <img src={s.productImageUrl} alt={s.productName ?? ''} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{s.productName}</p>
                      <p className="text-[10px] text-muted-foreground">{s.productBrand}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold shrink-0 ${
                      s.productStatus === 'Recall'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {s.productStatus === 'Recall' ? 'Rückruf' : 'Warnung'}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Recent scans */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Letzte Scans</p>
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-8">Laden...</p>
            ) : scans.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Noch keine Scans. Scanne ein Produkt!</p>
            ) : (
              <>
                <div className="rounded-xl border divide-y">
                  {scans.slice(0, 5).map((s) => (
                    <button
                      key={s.id}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-accent transition-colors"
                      onClick={() => navigate(`/product?id=${s.productId}`)}
                    >
                      {s.productImageUrl ? (
                        <img src={s.productImageUrl} alt={s.productName ?? ''} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{s.productName}</p>
                        <p className="text-[10px] text-muted-foreground">{s.productBrand}</p>
                      </div>
                      <div className={`h-2 w-2 rounded-full shrink-0 ${
                        s.productStatus === 'Recall' ? 'bg-red-500' : s.productStatus === 'Ok' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
                {scans.length > 5 && (
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
      </div>
    </div>
  )
}
