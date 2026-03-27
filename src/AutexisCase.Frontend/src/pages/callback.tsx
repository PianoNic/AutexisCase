import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'

export function CallbackPage() {
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!auth.isLoading) {
      if (auth.isAuthenticated) {
        navigate('/', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Anmeldung wird verarbeitet...</p>
    </div>
  )
}
