import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppAuth } from '@/auth/use-app-auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  LogOut,
  ScanLine,
  Award,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  Package,
} from 'lucide-react'
import { scanApi } from '@/api/client'
import type { ScanRecordDto } from '@/api/models/ScanRecordDto'
import type { AlertDto } from '@/api/models/AlertDto'

export default function ProfileScreen() {
  const { user, logout, isLoading, isVendor } = useAppAuth()
  const navigate = useNavigate()
  const [scans, setScans] = useState<ScanRecordDto[]>([])
  const [alerts, setAlerts] = useState<AlertDto[]>([])

  useEffect(() => {
    Promise.all([
      scanApi.getRecentScans().catch(() => []),
      scanApi.getMyAlerts().catch(() => []),
    ]).then(([s, a]) => {
      setScans(s)
      setAlerts(a)
    })
  }, [])

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase()
    : '?'

  const totalScans = scans.length
  const okCount = scans.filter((s) => s.productStatus === 'Ok').length
  const issueCount = scans.filter(
    (s) => s.productStatus === 'Warning' || s.productStatus === 'Recall'
  ).length
  const unreadAlerts = alerts.filter((a) => !a.read).length

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-12 pb-28 space-y-5">
          {/* User Info */}
          <div className="flex flex-col items-center gap-3 pt-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="text-base font-semibold">{user?.displayName ?? 'Nutzer'}</p>
              <p className="text-xs text-muted-foreground">{user?.email ?? ''}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border bg-primary/5 p-3 text-center">
              <ScanLine className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{totalScans}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Scans</p>
            </div>
            <div className="rounded-xl border bg-emerald-500/5 p-3 text-center">
              <Award className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
              <p className="text-lg font-bold">{okCount}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">OK</p>
            </div>
            <div className="rounded-xl border bg-amber-500/5 p-3 text-center">
              <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-amber-500" />
              <p className="text-lg font-bold">{issueCount}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Probleme</p>
            </div>
          </div>

          <Separator />

          {/* Vendor Portal Link — only for vendors */}
          {isVendor && (
          <button
            onClick={() => navigate('/admin')}
            className="flex w-full items-center gap-3 rounded-xl border bg-card p-3.5 text-left active:bg-accent transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Vendor Portal</p>
              <p className="text-[11px] text-muted-foreground">Produkte, Meldungen & Qualität verwalten</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {unreadAlerts > 0 && (
                <Badge variant="destructive" className="text-[10px] h-5 min-w-5 px-1.5">
                  {unreadAlerts}
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
          )}

          <Separator />

          {/* Recent Activity */}
          <ScanHistory scans={scans} navigate={navigate} />

          <Separator />

          <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Abmelden
          </Button>
        </div>
      </div>
    </div>
  )
}

function ScanHistory({ scans, navigate }: { scans: ScanRecordDto[]; navigate: (path: string) => void }) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Letzte Aktivität</p>
      {scans.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Noch keine Scans.</p>
      ) : (
        <>
          <div className="rounded-xl border divide-y">
            {scans.slice(0, 3).map((s) => {
              const status = String(s.productStatus ?? 'Ok')
              const hasIssue = status === 'Warning' || status === 'Recall' || status === '1' || status === '2'
              return (
                <button
                  key={s.id}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-accent transition-colors"
                  onClick={() => navigate(`/product?id=${s.productId}`)}
                >
                  {s.productImageUrl ? (
                    <img src={s.productImageUrl} alt={s.productName ?? ''} className="h-8 w-8 rounded-lg object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.productName}</p>
                    <p className="text-[10px] text-muted-foreground">{s.productBrand}</p>
                  </div>
                  {hasIssue && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
              )
            })}
          </div>
          {scans.length > 3 && (
            <button
              onClick={() => navigate('/history')}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium text-primary active:bg-accent transition-colors"
            >
              Alle {scans.length} Einträge anzeigen
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </>
      )}
    </section>
  )
}
