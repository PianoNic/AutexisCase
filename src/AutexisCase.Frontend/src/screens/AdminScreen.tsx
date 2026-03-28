import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  Package,
  Shield,
  Thermometer,
  Clock,
  ChevronRight,
  RefreshCw,
  CircleAlert,
  CheckCircle2,
  Flame,
} from 'lucide-react'
import { scanApi } from '@/api/client'
import type { ScanRecordDto } from '@/api/models/ScanRecordDto'
import type { AlertDto } from '@/api/models/AlertDto'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const severityLabel: Record<string, string> = {
  Info: 'Info',
  Warning: 'Warnung',
  Critical: 'Kritisch',
}

const severityColor: Record<string, string> = {
  Info: 'bg-blue-100 text-blue-700 border-blue-200',
  Warning: 'bg-amber-100 text-amber-700 border-amber-200',
  Critical: 'bg-red-100 text-red-700 border-red-200',
}

const severityDot: Record<string, string> = {
  Info: 'bg-blue-500',
  Warning: 'bg-amber-500',
  Critical: 'bg-red-500',
}

const alertTypeIcon: Record<string, typeof AlertTriangle> = {
  Recall: Shield,
  ColdChain: Thermometer,
  Expiry: Clock,
}

const alertTypeLabel: Record<string, string> = {
  Recall: 'Produktrückruf',
  ColdChain: 'Kühlkettenbruch',
  Expiry: 'Ablauf / MHD',
}

export default function AdminScreen() {
  const navigate = useNavigate()
  const [scans, setScans] = useState<ScanRecordDto[]>([])
  const [alerts, setAlerts] = useState<AlertDto[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      scanApi.getRecentScans().catch(() => []),
      scanApi.getMyAlerts().catch(() => []),
    ]).then(([s, a]) => {
      setScans(s)
      setAlerts(a)
      setLoading(false)
    })
  }

  useEffect(() => { fetchData() }, [])

  // Derived data
  const problemProducts = scans.filter(
    (s) => s.productStatus === 'Warning' || s.productStatus === 'Recall',
  )
  const recallProducts = scans.filter((s) => s.productStatus === 'Recall')
  const okProducts = scans.filter((s) => s.productStatus === 'Ok')

  const criticalAlerts = alerts.filter((a) => a.severity === 'Critical')
  const unreadAlerts = alerts.filter((a) => !a.read)

  // Unique products with issues (deduped by productId)
  const seenIds = new Set<string>()
  const uniqueProblemProducts = problemProducts.filter((s) => {
    if (!s.productId || seenIds.has(s.productId)) return false
    seenIds.add(s.productId)
    return true
  })

  // Sort alerts: critical first, then unread, then by date
  const sortedAlerts = [...alerts].sort((a, b) => {
    const sevOrder: Record<string, number> = { Critical: 0, Warning: 1, Info: 2 }
    const sevDiff = (sevOrder[a.severity as string] ?? 3) - (sevOrder[b.severity as string] ?? 3)
    if (sevDiff !== 0) return sevDiff
    if (a.read !== b.read) return a.read ? 1 : -1
    return (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0)
  })

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 bg-card/80 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <button
            onClick={() => navigate('/profile')}
            className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight">Vendor Dashboard</h1>
          </div>
          <button
            onClick={fetchData}
            className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Scrollable content — single page, no tabs */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="px-4 pt-4 pb-8 space-y-6">

            {/* ── Urgent banner ── */}
            {criticalAlerts.length > 0 && (
              <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-red-600" />
                  <p className="text-sm font-bold text-red-800">
                    Sofortiger Handlungsbedarf
                  </p>
                </div>
                <p className="text-xs text-red-700 leading-relaxed">
                  {criticalAlerts.length === 1
                    ? 'Ein kritisches Problem betrifft Ihre Produkte. Bitte prüfen Sie die Details unten.'
                    : `${criticalAlerts.length} kritische Probleme betreffen Ihre Produkte. Bitte prüfen Sie die Details unten.`}
                </p>
              </div>
            )}

            {/* ── Quick status strip ── */}
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl border p-3 text-center">
                <p className="text-xl font-bold">{scans.length}</p>
                <p className="text-[10px] text-muted-foreground">Produkte</p>
              </div>
              <div className="flex-1 rounded-xl border bg-emerald-500/5 p-3 text-center">
                <p className="text-xl font-bold text-emerald-700">{okProducts.length}</p>
                <p className="text-[10px] text-emerald-600">Einwandfrei</p>
              </div>
              <div className="flex-1 rounded-xl border bg-red-500/5 p-3 text-center">
                <p className="text-xl font-bold text-red-700">{problemProducts.length}</p>
                <p className="text-[10px] text-red-600">Auffällig</p>
              </div>
            </div>

            {/* ── Products with issues ── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <CircleAlert className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold">Produkte mit Auffälligkeiten</p>
              </div>

              {uniqueProblemProducts.length === 0 ? (
                <div className="rounded-xl border bg-emerald-500/5 p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <p className="text-sm text-emerald-700">
                    Alle Ihre Produkte sind einwandfrei. Keine Auffälligkeiten erkannt.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border divide-y">
                  {uniqueProblemProducts.map((s) => {
                    const isRecall = s.productStatus === 'Recall'
                    return (
                      <button
                        key={s.productId}
                        className="flex w-full items-center gap-3 px-3 py-3 text-left active:bg-accent transition-colors"
                        onClick={() => navigate(`/product?id=${s.productId}`)}
                      >
                        {s.productImageUrl ? (
                          <img
                            src={s.productImageUrl}
                            alt={s.productName ?? ''}
                            className="h-11 w-11 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-11 w-11 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{s.productName}</p>
                          <p className="text-[11px] text-muted-foreground">{s.productBrand}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 ${
                            isRecall
                              ? 'bg-red-100 text-red-700 border-red-200'
                              : 'bg-amber-100 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isRecall ? 'Rückruf' : 'Warnung'}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    )
                  })}
                </div>
              )}
            </section>

            <Separator />

            {/* ── Active alerts ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Aktive Meldungen</p>
                </div>
                {unreadAlerts.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {unreadAlerts.length} ungelesen
                  </Badge>
                )}
              </div>

              {sortedAlerts.length === 0 ? (
                <div className="rounded-xl border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Keine Meldungen vorhanden.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedAlerts.map((a) => {
                    const TypeIcon = alertTypeIcon[a.type as string] ?? AlertTriangle
                    return (
                      <div
                        key={a.id}
                        className={`rounded-xl border p-3 space-y-2 ${
                          a.severity === 'Critical'
                            ? 'border-red-200 bg-red-50'
                            : a.severity === 'Warning'
                              ? 'border-amber-200 bg-amber-50/50'
                              : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${severityDot[a.severity as string] ?? 'bg-gray-400'}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-semibold truncate flex-1">{a.title}</p>
                              <Badge variant="outline" className={`text-[9px] shrink-0 ${severityColor[a.severity as string] ?? ''}`}>
                                {severityLabel[a.severity as string] ?? a.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {a.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pl-4.5">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <TypeIcon className="h-3 w-3" />
                            <span>{alertTypeLabel[a.type as string] ?? a.type}</span>
                          </div>
                          {a.timestamp && (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(a.timestamp).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit',
                              })}
                            </span>
                          )}
                          {!a.read && (
                            <span className="text-[10px] font-semibold text-primary">Neu</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <Separator />

            {/* ── Products preview ── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">Alle Produkte</p>
                <span className="text-xs text-muted-foreground ml-auto">{scans.length} Einträge</span>
              </div>

              {scans.length === 0 ? (
                <div className="rounded-xl border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Noch keine Produkte erfasst.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border divide-y">
                    {scans.slice(0, 3).map((s) => {
                      const isOk = s.productStatus === 'Ok'
                      const isRecall = s.productStatus === 'Recall'
                      return (
                        <button
                          key={s.id}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-accent transition-colors"
                          onClick={() => navigate(`/product?id=${s.productId}`)}
                        >
                          {s.productImageUrl ? (
                            <img
                              src={s.productImageUrl}
                              alt={s.productName ?? ''}
                              className="h-9 w-9 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-9 w-9 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{s.productName}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-muted-foreground">{s.productBrand}</p>
                              {s.scannedAt && (
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(s.scannedAt).toLocaleDateString('de-DE')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className={`h-2 w-2 rounded-full shrink-0 ${
                            isRecall ? 'bg-red-500' : isOk ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} />
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </button>
                      )
                    })}
                  </div>
                  {scans.length > 3 && (
                    <button
                      onClick={() => navigate('/admin/products')}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium text-primary active:bg-accent transition-colors"
                    >
                      Alle {scans.length} Produkte anzeigen
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}
            </section>

          </div>
        )}
      </div>
    </div>
  )
}
