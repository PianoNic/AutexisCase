import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAppAuth } from '@/auth/use-app-auth'

interface ProductSummary {
  id: string
  gtin: string
  name: string
  brand: string
  imageUrl: string | null
  category: string | null
  status: number
  nutriScore: string | null
  riskScore: number
}

interface AlertItem {
  id: string
  type: number
  severity: number
  title: string
  description: string | null
  timestamp: string
  read: boolean
  productId: string
}

const statusMap: Record<number, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  0: { label: 'OK', variant: 'default' },
  1: { label: 'Warning', variant: 'secondary' },
  2: { label: 'Recall', variant: 'destructive' },
}

const statusDot: Record<number, string> = {
  0: 'bg-primary',
  1: 'bg-amber-500',
  2: 'bg-destructive',
}

const severityVariant: Record<number, 'default' | 'destructive'> = {
  0: 'default',
  1: 'default',
  2: 'destructive',
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return new Date(timestamp).toLocaleDateString('en', { weekday: 'short' })
  return new Date(timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export default function HomeScreen() {
  const navigate = useNavigate()
  const { user, accessToken } = useAppAuth()
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])

  useEffect(() => {
    if (!accessToken) return
    const headers = { Authorization: `Bearer ${accessToken}` }

    fetch('/api/Product', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(setProducts)
      .catch(console.error)

    fetch('/api/Product', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(async (prods: ProductSummary[]) => {
        const allAlerts: AlertItem[] = []
        for (const p of prods) {
          try {
            const res = await fetch(`/api/Product/${p.id}`, { headers })
            if (res.ok) {
              const full = await res.json()
              if (full.alerts) allAlerts.push(...full.alerts.map((a: any) => ({ ...a, productId: p.id })))
            }
          } catch { /* skip */ }
        }
        setAlerts(allAlerts)
      })
      .catch(console.error)
  }, [accessToken])

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-12 pb-5">
          <div className="flex items-center gap-2 flex-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
              <svg className="h-4 w-4 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a9 9 0 0 1 9 9c0 5.25-9 13-9 13S3 16.25 3 11a9 9 0 0 1 9-9z" />
                <circle cx="12" cy="11" r="3" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight">Track my Food</span>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:block">{user.displayName}</span>
              <Avatar size="sm">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        <div className="px-4 space-y-5 pb-4">
          {/* Alerts */}
          {alerts.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Alerts</p>
              {alerts.map((alert) => (
                <Alert key={alert.id} variant={severityVariant[alert.severity] ?? 'default'}>
                  <AlertTitle>{alert.title}</AlertTitle>
                  {alert.description && <AlertDescription>{alert.description}</AlertDescription>}
                </Alert>
              ))}
            </section>
          )}

          {/* Products */}
          <section className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Products</p>
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No products yet. Scan one to get started.</p>
            ) : (
              <Card size="sm">
                <CardContent className="!px-0 !py-0">
                  {products.map((item, i) => {
                    const status = statusMap[item.status] ?? statusMap[0]
                    return (
                      <div key={item.id}>
                        <button
                          onClick={() => navigate(`/product?id=${item.id}`)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                        >
                          <div className={`h-2 w-2 rounded-full shrink-0 ${statusDot[item.status] ?? 'bg-primary'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.brand}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {item.nutriScore && <span className="text-xs text-muted-foreground">Nutri {item.nutriScore}</span>}
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </div>
                        </button>
                        {i < products.length - 1 && <Separator />}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </div>

      {/* Fixed bottom scan button */}
      <div className="shrink-0 px-4 py-4 border-t border-border bg-background">
        <Button className="w-full" size="lg" onClick={() => navigate('/scan')}>
          <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
            <rect x="7" y="7" width="10" height="10" rx="1" />
          </svg>
          Scan Product
        </Button>
      </div>
    </div>
  )
}
