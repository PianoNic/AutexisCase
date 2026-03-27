import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAppAuth } from '@/auth/use-app-auth'

export default function LotCaptureScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { accessToken } = useAppAuth()
  const gtin = searchParams.get('gtin') ?? ''
  const productName = searchParams.get('name') ?? 'Product'

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [capturing, setCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualLot, setManualLot] = useState('')
  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraReady, setCameraReady] = useState(false)

  useEffect(() => {
    if (mode !== 'camera') return

    let cancelled = false
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 }, focusMode: 'continuous' } as any,
      audio: false,
    }).then(async stream => {
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraReady(true)
      }
    }).catch(() => {
      if (!cancelled) setMode('manual')
    })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      setCameraReady(false)
    }
  }, [mode])

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current || !accessToken) return
    setCapturing(true)
    setError(null)

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(async (blob) => {
      if (!blob) { setCapturing(false); setError('Failed to capture image'); return }

      const formData = new FormData()
      formData.append('image', blob, 'lot-capture.jpg')

      try {
        const res = await fetch('/api/Ocr/lot', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        })

        if (res.ok) {
          const data = await res.json()
          if (data.success && data.lotNumber) {
            streamRef.current?.getTracks().forEach(t => t.stop())
            navigate(`/product?gtin=${gtin}&lot=${data.lotNumber}`)
            return
          }
        }
        setError('LOT nicht erkannt. Erneut versuchen oder manuell eingeben.')
        setCapturing(false)
      } catch {
        setError('Verarbeitung fehlgeschlagen')
        setCapturing(false)
      }
    }, 'image/jpeg', 0.9)
  }

  const submitManualLot = () => {
    if (!manualLot.trim()) return
    streamRef.current?.getTracks().forEach(t => t.stop())
    navigate(`/product?gtin=${gtin}&lot=${manualLot.trim()}`)
  }

  const skipLot = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    navigate(`/product?gtin=${gtin}`)
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {mode === 'camera' && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <canvas ref={canvasRef} className="hidden" />


      {/* Top gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-black/70 to-transparent" />

      {/* Header */}
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-12 z-10">
        <button
          onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); navigate('/scan') }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
          aria-label="Back"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="ml-3">
          <span className="text-sm font-medium text-white">Chargennummer scannen</span>
          <p className="text-xs text-white/60">{productName}</p>
        </div>

      </div>

      {/* Camera viewfinder */}
      {mode === 'camera' && cameraReady && (
        <div className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center" style={{ paddingBottom: '200px' }}>
          <div className="relative h-20 w-72">
            <div className="absolute top-0 left-0 h-6 w-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 h-6 w-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-white rounded-br-lg" />
          </div>
          <p className="mt-3 text-xs text-white/70 text-center px-8">
            Richte die Kamera auf die Chargennummer (LOT/Batch)
          </p>
        </div>
      )}

      {/* Manual mode background */}
      {mode === 'manual' && (
        <div className="absolute inset-0 bg-background" />
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <Card size="sm" className="bg-card/95 backdrop-blur-md">
          <CardContent className="space-y-3 py-4">
            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}

            {mode === 'camera' ? (
              <>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={captureAndProcess}
                  disabled={capturing || !cameraReady}
                >
                  {capturing ? 'Verarbeite...' : 'Foto aufnehmen'}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setMode('manual') }}>
                    Manuell eingeben
                  </Button>
                  <Button variant="ghost" className="flex-1 text-muted-foreground" onClick={skipLot}>
                    Überspringen
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Chargennummer / LOT</label>
                  <input
                    type="text"
                    value={manualLot}
                    onChange={(e) => setManualLot(e.target.value)}
                    placeholder="z.B. M5500, LX-2026-0142"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') submitManualLot() }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={submitManualLot} disabled={!manualLot.trim()}>
                    Suchen
                  </Button>
                  <Button variant="ghost" className="flex-1 text-muted-foreground" onClick={skipLot}>
                    Überspringen
                  </Button>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setMode('camera')}>
                  Kamera verwenden
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
