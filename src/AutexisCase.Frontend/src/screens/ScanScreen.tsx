import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const recentScans = [
  { id: 1, name: 'Lindt Excellence 70%', brand: 'Lindt', status: 'ok' },
  { id: 2, name: 'Bio Vollmilch 3.5%', brand: 'Migros', status: 'recall' },
  { id: 3, name: 'Gruyère AOP', brand: 'Le Gruyère', status: 'ok' },
]

const statusBadge: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  ok: { label: 'OK', variant: 'default' },
  warning: { label: 'Warning', variant: 'secondary' },
  recall: { label: 'Recall', variant: 'destructive' },
}

export default function ScanScreen() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    let stream: MediaStream | null = null
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
      })
      .catch(() => setPermissionDenied(true))
    return () => { stream?.getTracks().forEach((t) => t.stop()) }
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Camera feed */}
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />

      {/* No camera fallback */}
      {permissionDenied && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="text-center space-y-2 px-8">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <svg className="h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.361a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            </div>
            <p className="font-medium text-sm">Camera access denied</p>
            <p className="text-xs text-muted-foreground">Enable camera in your browser settings.</p>
          </div>
        </div>
      )}

      {/* Top gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />

      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 flex items-center px-4 pt-12">
        <button
          onClick={() => navigate('/')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
          aria-label="Back"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <span className="ml-3 text-sm font-medium text-white">Scan Product</span>
      </div>

      {/* Scanner frame */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '220px' }}>
        <div className="relative h-56 w-56">
          {[
            'top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl',
            'top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl',
            'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl',
            'bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl',
          ].map((cls, i) => (
            <div key={i} className={`absolute h-8 w-8 border-white ${cls}`} />
          ))}
          <div className="absolute inset-x-0 animate-scan">
            <div className="h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>
        </div>
      </div>

      {/* Bottom card with recent scans */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <Card size="sm" className="bg-card/90 backdrop-blur-md">
          <CardContent className="!px-0 !py-0">
            <div className="px-4 py-2.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Recently Scanned</p>
            </div>
            <Separator />
            {recentScans.map((item, i) => (
              <div key={item.id}>
                <button
                  onClick={() => navigate('/product')}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.brand}</p>
                  </div>
                  <Badge variant={statusBadge[item.status].variant}>
                    {statusBadge[item.status].label}
                  </Badge>
                </button>
                {i < recentScans.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
