import { useEffect, useState } from 'react'
import { useAppAuth } from '@/auth/use-app-auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { LogOut, ScanLine, Award } from 'lucide-react'
import { scanApi } from '@/api/client'
import type { ScanRecordDto } from '@/api/models/ScanRecordDto'

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAppAuth()
  const [scans, setScans] = useState<ScanRecordDto[]>([])

  useEffect(() => {
    scanApi.getRecentScans().then(setScans).catch(() => {})
  }, [])

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase()
    : '?'

  const totalScans = scans.length
  const okCount = scans.filter((s) => s.productStatus === 0).length

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
        <div className="px-4 pt-12 pb-28 space-y-6">
          <div className="flex flex-col items-center gap-3 pt-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="text-base font-semibold">{user?.displayName ?? 'Nutzer'}</p>
              <p className="text-xs text-muted-foreground">{user?.email ?? ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border bg-primary/5 p-3 text-center">
              <ScanLine className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{totalScans}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Scans</p>
            </div>
            <div className="rounded-xl border bg-emerald-500/5 p-3 text-center">
              <Award className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
              <p className="text-lg font-bold">{okCount}/{totalScans}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Ohne Probleme</p>
            </div>
          </div>

          <Separator />

          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Letzte Aktivität</p>
            {scans.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Noch keine Scans.</p>
            ) : (
              <div className="rounded-xl border divide-y">
                {scans.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-3 py-2.5">
                    {s.productImageUrl && (
                      <img src={s.productImageUrl} alt={s.productName ?? ''} className="h-8 w-8 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.productName}</p>
                      <p className="text-[10px] text-muted-foreground">{s.productBrand}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

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
