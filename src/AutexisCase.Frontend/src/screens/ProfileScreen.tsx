import { useAppAuth } from '@/auth/use-app-auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { LogOut, ScanLine, Leaf, Award } from 'lucide-react'
import { scanHistory } from '@/data/mock'

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAppAuth()

  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?'

  const totalScans = scanHistory.length
  const bioPercent = Math.round(
    (scanHistory.filter((s) => s.nutriScore === 'A').length / totalScans) * 100,
  )
  const avgCo2 = (
    scanHistory.reduce((sum) => sum + 1.2, 0) / totalScans
  ).toFixed(1)

  const nutriCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 }
  scanHistory.forEach((s) => {
    if (s.nutriScore) nutriCounts[s.nutriScore] = (nutriCounts[s.nutriScore] || 0) + 1
  })

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
          {/* User header */}
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
              <Leaf className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
              <p className="text-lg font-bold">{bioPercent}%</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Bio-Anteil</p>
            </div>
            <div className="rounded-xl border bg-amber-500/5 p-3 text-center">
              <Award className="h-4 w-4 mx-auto mb-1 text-amber-500" />
              <p className="text-lg font-bold">{avgCo2}kg</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Ø CO₂</p>
            </div>
          </div>

          <Separator />

          {/* Nutri-Score distribution */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Deine Übersicht
            </p>
            <div className="rounded-xl border p-3 space-y-2">
              <p className="text-xs font-medium">Nutri-Score Verteilung</p>
              <div className="flex gap-1.5">
                {(['A', 'B', 'C', 'D', 'E'] as const).map((grade) => {
                  const colors: Record<string, string> = {
                    A: 'bg-emerald-500',
                    B: 'bg-lime-500',
                    C: 'bg-yellow-500',
                    D: 'bg-orange-500',
                    E: 'bg-red-500',
                  }
                  const count = nutriCounts[grade] || 0
                  return (
                    <div key={grade} className="flex-1 text-center">
                      <div className="relative mx-auto mb-1 h-16 w-full rounded-lg bg-muted/50 overflow-hidden">
                        <div
                          className={`absolute bottom-0 w-full rounded-b-lg ${colors[grade]} opacity-20`}
                          style={{ height: `${totalScans > 0 ? (count / totalScans) * 100 : 0}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold">{count}</span>
                        </div>
                      </div>
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${colors[grade]}`}>
                        {grade}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <Separator />

          {/* Recent activity */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Letzte Aktivität</p>
            <div className="rounded-xl border divide-y">
              {scanHistory.slice(0, 4).map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-3 py-2.5">
                  <img
                    src={s.imageUrl ?? ''}
                    alt={s.name ?? ''}
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.brand}</p>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${
                      s.nutriScore === 'A'
                        ? 'bg-emerald-500'
                        : s.nutriScore === 'B'
                          ? 'bg-lime-500'
                          : s.nutriScore === 'D'
                            ? 'bg-orange-500'
                            : 'bg-yellow-500'
                    }`}
                  >
                    {s.nutriScore}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Logout */}
          <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Abmelden
          </Button>
        </div>
      </div>
    </div>
  )
}
