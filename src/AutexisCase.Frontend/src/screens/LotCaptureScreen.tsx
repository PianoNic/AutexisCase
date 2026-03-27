import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Camera, Keyboard, SkipForward } from 'lucide-react'
import { useAppAuth } from '@/auth/use-app-auth'

export default function LotCaptureScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { accessToken } = useAppAuth()
  const gtin = searchParams.get('gtin') ?? ''

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const [manualLot, setManualLot] = useState('')

  useEffect(() => {
    if (mode !== 'camera') return

    let cancelled = false
    const startCam = async () => {
      const attempts = [
        { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 }, focusMode: 'continuous' } as any,
        { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        { facingMode: 'user' },
      ]

      for (const constraints of attempts) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: constraints, audio: false })
          if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            await videoRef.current.play()
            setCameraReady(true)
          }
          return
        } catch { continue }
      }
      if (!cancelled) setMode('manual')
    }
    startCam()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      setCameraReady(false)
    }
  }, [mode])

  const cleanup = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  const resumeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.enabled = true)
    videoRef.current?.play()
  }

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current || !accessToken) return
    setCapturing(true)
    setError(null)

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)

    // Freeze the camera feed
    video.pause()
    streamRef.current?.getTracks().forEach(t => t.enabled = false)

    canvas.toBlob(async (blob) => {
      if (!blob) { setCapturing(false); setError('Aufnahme fehlgeschlagen'); return }

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
            cleanup()
            navigate(`/product?gtin=${gtin}&lot=${data.lotNumber}`)
            return
          }
        }
        setError('LOT nicht erkannt — erneut versuchen')
        setCapturing(false)
        resumeCamera()
      } catch {
        setError('Verarbeitung fehlgeschlagen')
        setCapturing(false)
        resumeCamera()
      }
    }, 'image/jpeg', 0.9)
  }

  const submitManualLot = () => {
    if (!manualLot.trim()) return
    cleanup()
    navigate(`/product?gtin=${gtin}&lot=${manualLot.trim()}`)
  }

  const skip = () => {
    cleanup()
    navigate(`/product?gtin=${gtin}`)
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {mode === 'camera' && (
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
      )}
      {mode === 'manual' && <div className="absolute inset-0 bg-background" />}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent z-[1]" />

      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 pt-12">
        <button
          onClick={() => { cleanup(); navigate('/scan') }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4 text-white" />
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-white">Chargennummer</p>
          <p className="text-[10px] text-white/50">{gtin}</p>
        </div>
        <button
          onClick={() => { if (mode === 'camera') { cleanup(); setMode('manual') } else setMode('camera') }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
        >
          {mode === 'camera' ? <Keyboard className="h-4 w-4 text-white" /> : <Camera className="h-4 w-4 text-white" />}
        </button>
      </div>

      {mode === 'camera' ? (
        <>
          {/* Viewfinder */}
          {cameraReady && (
            <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center" style={{ paddingBottom: '160px' }}>
              <div className="relative h-20 w-72">
                <div className="absolute top-0 left-0 h-6 w-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 h-6 w-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-white rounded-br-lg" />
                <p className="absolute -bottom-7 left-0 right-0 text-center text-xs text-white/60">
                  LOT / Charge auf Verpackung finden
                </p>
              </div>
            </div>
          )}

          {/* Error toast */}
          {error && (
            <div className="absolute left-4 right-4 top-28 z-20 rounded-xl bg-red-500/90 backdrop-blur-sm px-4 py-2.5 text-center">
              <p className="text-xs font-medium text-white">{error}</p>
            </div>
          )}

          {/* Bottom: shutter button + skip */}
          <div className="absolute bottom-0 left-0 right-0 z-20 pb-12 pt-6 bg-gradient-to-t from-black/60 to-transparent">
            <div className="flex items-center justify-center gap-8">
              <button onClick={skip} className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                  <SkipForward className="h-4 w-4 text-white" />
                </div>
                <span className="text-[10px] text-white/60">Überspringen</span>
              </button>

              <button
                onClick={captureAndProcess}
                disabled={capturing || !cameraReady}
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white disabled:opacity-40"
              >
                <div className={`h-[56px] w-[56px] rounded-full ${capturing ? 'bg-red-500 animate-pulse' : 'bg-white'}`} />
              </button>

              <div className="w-10" />
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-8">
          <div className="w-full max-w-xs space-y-4">
            <div className="text-center">
              <p className="text-sm font-semibold">Chargennummer eingeben</p>
              <p className="text-xs text-muted-foreground mt-1">Steht auf der Verpackung als LOT, L, Charge oder Batch</p>
            </div>
            <input
              value={manualLot}
              onChange={(e) => setManualLot(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitManualLot()}
              placeholder="z.B. M5500, LX-2026-0142"
              autoFocus
              className="w-full rounded-xl border px-4 py-3 text-sm text-center outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={submitManualLot}
              disabled={!manualLot.trim()}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              Suchen
            </button>
            <button onClick={skip} className="w-full py-2 text-sm text-muted-foreground">
              Überspringen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
