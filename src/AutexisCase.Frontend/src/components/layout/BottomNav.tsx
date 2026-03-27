import { useLocation, useNavigate } from 'react-router-dom'
import { Home, ScanLine, User } from 'lucide-react'

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const isHome = location.pathname === '/'
  const isProfile = location.pathname === '/profile'

  // Hide nav on login, callback, and product detail screens
  if (
    location.pathname === '/login' ||
    location.pathname === '/callback' ||
    location.pathname.startsWith('/product/')
  ) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60]">
      <div className="mx-auto max-w-md">
        <div className="relative flex items-end justify-around border-t bg-card/90 backdrop-blur-xl px-6 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors ${
              isHome ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            <Home className="h-5 w-5" strokeWidth={isHome ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">Home</span>
          </button>

          <div className="relative -mt-7">
            <button
              onClick={() => navigate('/scan')}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 active:scale-95"
            >
              <ScanLine className="h-7 w-7" strokeWidth={2.2} />
            </button>
            <span className="mt-1 block text-center text-[10px] font-medium text-muted-foreground">
              Scan
            </span>
          </div>

          <button
            onClick={() => navigate('/profile')}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors ${
              isProfile ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            <User className="h-5 w-5" strokeWidth={isProfile ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">Profil</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
