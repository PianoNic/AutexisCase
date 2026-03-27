import { useAppAuth } from '@/auth/use-app-auth'
import { Button } from '@/components/ui/button'

export function HomePage() {
  const { user, logout, isLoading } = useAppAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Track my Food</h1>
        {user && (
          <p className="text-muted-foreground">
            Willkommen, {user.displayName}
          </p>
        )}
        <Button variant="outline" onClick={logout}>
          Abmelden
        </Button>
      </div>
    </div>
  )
}
