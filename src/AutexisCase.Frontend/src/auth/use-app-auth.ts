import { useAuth } from 'react-oidc-context'
import { useEffect, useState, useCallback } from 'react'

export interface AppUser {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  roles: string[] | null
  createdAt: string
}

export function useAppAuth() {
  const auth = useAuth()
  const [user, setUser] = useState<AppUser | null>(null)
  const [syncing, setSyncing] = useState(false)

  const syncUser = useCallback(async (token: string) => {
    setSyncing(true)
    try {
      const res = await fetch('/api/Auth/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      }
    } catch (err) {
      console.error('Failed to sync user', err)
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.access_token && !user) {
      syncUser(auth.user.access_token)
    }
  }, [auth.isAuthenticated, auth.user?.access_token, user, syncUser])

  const isVendor = user?.roles?.some(r => r === 'Vendor' || r === 'Admin') ?? false

  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading || syncing,
    user,
    isVendor,
    accessToken: auth.user?.access_token ?? null,
    login: () => auth.signinRedirect(),
    logout: () => auth.signoutRedirect(),
  }
}
