import { useAuth } from 'react-oidc-context'
import { Navigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginPage() {
  const auth = useAuth()

  if (auth.isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm shadow-lg border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Leaf className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Track my Food
          </CardTitle>
          <CardDescription className="text-sm">
            Scanne. Verfolge. Vertraue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => auth.signinRedirect()}>
            Anmelden
          </Button>
          <div className="mt-6 space-y-2">
            <p className="text-center text-xs text-muted-foreground">
              Von Feld bis Regal — transparent und sicher.
            </p>
            <div className="flex justify-center gap-4 pt-1">
              <span className="text-[10px] text-muted-foreground">Herkunft</span>
              <span className="text-[10px] text-muted-foreground">Kuhlkette</span>
              <span className="text-[10px] text-muted-foreground">Nachhaltigkeit</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
