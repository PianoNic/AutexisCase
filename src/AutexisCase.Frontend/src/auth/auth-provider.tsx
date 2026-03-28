import { useEffect, useState, type ReactNode } from 'react'
import { AuthProvider as OidcAuthProvider, useAuth } from 'react-oidc-context'
import { WebStorageStateStore } from 'oidc-client-ts'
import { setApiToken } from '@/api/client'

function TokenSync({ children }: { children: ReactNode }) {
  const auth = useAuth()
  useEffect(() => {
    setApiToken(auth.user?.access_token ?? null)
  }, [auth.user?.access_token])

  // Auto-logout on token expiry
  useEffect(() => {
    if (!auth.user) return
    const expiresIn = (auth.user.expires_at ?? 0) - Math.floor(Date.now() / 1000)
    if (expiresIn <= 0) {
      auth.removeUser()
      return
    }
    const timer = setTimeout(() => auth.removeUser(), expiresIn * 1000)
    return () => clearTimeout(timer)
  }, [auth.user?.expires_at])

  return <>{children}</>
}

interface AppConfig {
  authority: string
  clientId: string
  redirectUri: string
  postLogoutRedirectUri: string
  scope: string
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null)

  useEffect(() => {
    fetch('/api/App/config')
      .then((r) => r.json())
      .then(setConfig)
      .catch(console.error)
  }, [])

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <OidcAuthProvider
      authority={config.authority}
      client_id={config.clientId}
      redirect_uri={`${window.location.origin}/callback`}
      post_logout_redirect_uri={`${window.location.origin}/`}
      scope={config.scope}
      response_type="code"
      userStore={new WebStorageStateStore({ store: window.localStorage })}
      onSigninCallback={() => {
        window.history.replaceState({}, document.title, window.location.pathname)
      }}
    >
      <TokenSync>{children}</TokenSync>
    </OidcAuthProvider>
  )
}
