import { useAuth } from 'react-oidc-context'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginPage() {
  const auth = useAuth()

  if (auth.isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Track my Food
          </CardTitle>
          <CardDescription>
            Von Feld bis Regal — transparent und sicher.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => auth.signinRedirect()}>
            Anmelden
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
