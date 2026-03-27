import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAppAuth } from '@/auth/use-app-auth'

interface ScanRecord {
  id: string
  productId: string
  productName: string
  productBrand: string
  productStatus: number
  scannedAt: string
}

const statusBadge: Record<number, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  0: { label: 'OK', variant: 'default' },
  1: { label: 'Warning', variant: 'secondary' },
  2: { label: 'Recall', variant: 'destructive' },
}

export default function ScanScreen() {
  const navigate = useNavigate()
  const { accessToken } = useAppAuth()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([])

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/Scan/recent', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setRecentScans)
      .catch(console.error)
  }, [accessToken])

  useEffect(() => {
    let started = false
    const scanner = new Html5Qrcode('scanner-region')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1 },
      async (decodedText) => {
        if (scanning) return
        setScanning(true)

        scanner.pause()

        if (accessToken) {
          try {
            await fetch(`/api/Scan/${decodedText}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}` },
            })
          } catch { /* best effort */ }
        }

        navigate(`/product?gtin=${decodedText}`)
      },
      () => {}
    ).then(() => { started = true }).catch(() => setError('Camera access denied'))

    return () => {
      if (started) scanner.stop().catch(() => {})
    }
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <div id="scanner-region" className="absolute inset-0 h-full w-full [&_video]:!object-cover [&_video]:!h-full [&_video]:!w-full [&>div]:!border-none [&_img]:hidden" />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="text-center space-y-2 px-8">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <svg className="h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.361a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            </div>
            <p className="font-medium text-sm">{error}</p>
            <p className="text-xs text-muted-foreground">Enable camera in your browser settings.</p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />

      <div className="absolute left-0 right-0 top-0 flex items-center px-4 pt-12 z-10">
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

      {recentScans.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <Card size="sm" className="bg-card/90 backdrop-blur-md">
            <CardContent className="!px-0 !py-0">
              <div className="px-4 py-2.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Recently Scanned</p>
              </div>
              <Separator />
              {recentScans.slice(0, 3).map((item, i) => {
                const status = statusBadge[item.productStatus] ?? statusBadge[0]
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => navigate(`/product?id=${item.productId}`)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-muted/40 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.productBrand}</p>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </button>
                    {i < Math.min(recentScans.length, 3) - 1 && <Separator />}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
