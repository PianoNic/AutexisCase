import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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

// Use native BarcodeDetector if available (Chrome/Edge), otherwise fallback to zxing-wasm
async function createScanner() {
  if ('BarcodeDetector' in window) {
    const detector = new (window as any).BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'data_matrix'],
    })
    return {
      scan: async (source: HTMLVideoElement) => {
        const results = await detector.detect(source)
        return results.length > 0 ? results[0].rawValue : null
      },
    }
  }

  // Fallback: zxing-wasm
  const { readBarcodesFromImageData } = await import('zxing-wasm/reader')
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  return {
    scan: async (source: HTMLVideoElement) => {
      const w = source.videoWidth
      const h = source.videoHeight
      if (w === 0 || h === 0) return null
      canvas.width = w
      canvas.height = h
      ctx.drawImage(source, 0, 0)
      const imageData = ctx.getImageData(0, 0, w, h)
      const results = await readBarcodesFromImageData(imageData, {
        formats: ['EAN-8', 'EAN-13', 'UPC-A', 'UPC-E', 'Code128', 'Code39', 'QRCode', 'DataMatrix'],
        tryHarder: true,
      })
      return results.length > 0 && results[0].text ? results[0].text : null
    },
  }
}

export default function ScanScreen() {
  const navigate = useNavigate()
  const { accessToken } = useAppAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const foundRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([])
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [cameraIdx, setCameraIdx] = useState(0)
  const streamRef = useRef<MediaStream | null>(null)
  const scannerRef = useRef<{ scan: (v: HTMLVideoElement) => Promise<string | null> } | null>(null)

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/Scan/recent', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setRecentScans)
      .catch(console.error)
  }, [accessToken])

  const startCamera = useCallback(async (deviceId?: string) => {
    streamRef.current?.getTracks().forEach(t => t.stop())

    const videoConstraints: MediaTrackConstraints = deviceId
      ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      : { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Apply autofocus after stream starts
      const track = stream.getVideoTracks()[0]
      if (track) {
        try {
          await track.applyConstraints({
            advanced: [
              { focusMode: 'continuous' } as any,
              { exposureMode: 'continuous' } as any,
            ],
          })
        } catch { /* unsupported */ }
      }

      setError(null)
      const devices = await navigator.mediaDevices.enumerateDevices()
      setCameras(devices.filter(d => d.kind === 'videoinput'))
    } catch {
      if (!deviceId) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            await videoRef.current.play()
          }
          setError(null)
          const devices = await navigator.mediaDevices.enumerateDevices()
          setCameras(devices.filter(d => d.kind === 'videoinput'))
        } catch {
          setError('Camera access denied')
        }
      } else {
        setError('Camera access denied')
      }
    }
  }, [])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    const init = async () => {
      await startCamera()
      scannerRef.current = await createScanner()

      // Scan loop
      interval = setInterval(async () => {
        if (foundRef.current || !videoRef.current || videoRef.current.readyState < 2 || !scannerRef.current) return

        try {
          const code = await scannerRef.current.scan(videoRef.current)
          if (code && !foundRef.current) {
            foundRef.current = true

            if (accessToken) {
              try {
                await fetch(`/api/Scan/${code}`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${accessToken}` },
                })
              } catch { /* best effort */ }
            }

            navigate(`/scan/lot?gtin=${code}`)
          }
        } catch { /* continue */ }
      }, 100)
    }

    init()

    return () => {
      clearInterval(interval)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [startCamera, accessToken, navigate])

  const switchCamera = async () => {
    if (cameras.length < 2) return
    const nextIdx = (cameraIdx + 1) % cameras.length
    setCameraIdx(nextIdx)
    await startCamera(cameras[nextIdx].deviceId)
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
          <div className="text-center space-y-3 px-8">
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

      {/* Scan viewfinder */}
      {!error && (
        <div className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center" style={{ paddingBottom: '160px' }}>
          <div className="relative h-28 w-64">
            <div className="absolute top-0 left-0 h-8 w-8 border-t-2 border-l-2 border-white rounded-tl-xl" />
            <div className="absolute top-0 right-0 h-8 w-8 border-t-2 border-r-2 border-white rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-white rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-white rounded-br-xl" />
            <div className="absolute inset-x-4 top-4 bottom-4 overflow-hidden">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-green-400/80 to-transparent animate-[scan_2s_ease-in-out_infinite]" />
            </div>
          </div>
          <p className="mt-4 text-xs text-white/70 text-center px-8">
            Richte die Kamera auf den Barcode des Produkts
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-black/60 to-transparent" />

      <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-12 z-10">
        <div className="flex items-center">
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

        {cameras.length > 1 && !error && (
          <button
            onClick={switchCamera}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
            aria-label="Switch camera"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
              <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
              <polyline points="16 3 19 6 16 9" />
              <polyline points="8 15 5 18 8 21" />
            </svg>
          </button>
        )}
      </div>

      {recentScans.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <Card size="sm" className="bg-card/90 backdrop-blur-md">
            <CardContent className="px-0! py-0!">
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
