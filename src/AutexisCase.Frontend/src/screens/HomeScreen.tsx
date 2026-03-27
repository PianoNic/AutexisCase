import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

const alerts = [
  {
    id: 1,
    variant: 'destructive' as const,
    title: 'Recall: Bio Vollmilch 3.5%',
    description: 'Lot #MG-2024-0891 recalled due to contamination risk. Do not consume.',
  },
  {
    id: 2,
    variant: 'default' as const,
    title: 'Lindt Excellence 70% cleared',
    description: 'Previous warning resolved. Product is safe to consume.',
  },
]

const history = [
  { id: 1, name: 'Lindt Excellence 70%', brand: 'Lindt', origin: 'Ghana', date: 'Today', status: 'ok' },
  { id: 2, name: 'Bio Vollmilch 3.5%', brand: 'Migros', origin: 'Switzerland', date: 'Yesterday', status: 'recall' },
  { id: 3, name: 'Organic Sea Salt Chips', brand: 'Salazon', origin: 'USA', date: 'Mon', status: 'ok' },
  { id: 4, name: 'Gruyère AOP', brand: 'Le Gruyère', origin: 'Switzerland', date: 'Sun', status: 'ok' },
]

const statusBadge: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  ok: { label: 'OK', variant: 'default' },
  warning: { label: 'Warning', variant: 'secondary' },
  recall: { label: 'Recall', variant: 'destructive' },
}

export default function HomeScreen() {
  const navigate = useNavigate()

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-12 pb-5">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
              <svg className="h-4 w-4 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a9 9 0 0 1 9 9c0 5.25-9 13-9 13S3 16.25 3 11a9 9 0 0 1 9-9z" />
                <circle cx="12" cy="11" r="3" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight">Track my Food</span>
          </div>
          {/* User */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">Stefan K.</span>
            <Avatar size="sm">
              <AvatarFallback>SK</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="px-4 space-y-5 pb-4">
          {/* Alerts */}
          <section className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Alerts
            </p>
            {alerts.map((alert) => (
              <Alert key={alert.id} variant={alert.variant}>
                <AlertTitle>{alert.title}</AlertTitle>
                <AlertDescription>{alert.description}</AlertDescription>
              </Alert>
            ))}
          </section>

          {/* History */}
          <section className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Recently Scanned
            </p>
            <Card size="sm">
              <CardContent className="!px-0 !py-0">
                {history.map((item, i) => (
                  <div key={item.id}>
                    <button
                      onClick={() => navigate('/product')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                    >
                      {/* Status dot */}
                      <div className={`h-2 w-2 rounded-full shrink-0 ${item.status === 'ok' ? 'bg-primary' : item.status === 'recall' ? 'bg-destructive' : 'bg-amber-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.brand} · {item.origin}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{item.date}</span>
                        <Badge variant={statusBadge[item.status].variant}>
                          {statusBadge[item.status].label}
                        </Badge>
                      </div>
                    </button>
                    {i < history.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
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
