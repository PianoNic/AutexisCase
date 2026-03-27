import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Keyboard, X, SwitchCamera } from 'lucide-react'
import { useAppAuth } from '@/auth/use-app-auth'

// Use native BarcodeDetector if available, otherwise fallback to zxing-wasm
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
  const [showManual, setShowManual] = useState(false)
  const [barcode, setBarcode] = useState('')
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [cameraIdx, setCameraIdx] = useState(0)
  const streamRef = useRef<MediaStream | null>(null)
  const scannerRef = useRef<{ scan: (v: HTMLVideoElement) => Promise<string | null> } | null>(null)

  const handleFound = useCallback(async (gtin: string) => {
    if (foundRef.current) return
    foundRef.current = true

    if (accessToken) {
      try {
        await fetch(`/api/Scan/${gtin}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      } catch { /* best effort */ }
    }

    navigate(`/scan/lot?gtin=${gtin}`)
  }, [accessToken, navigate])

  const startCamera = useCallback(async (deviceId?: string) => {
    streamRef.current?.getTracks().forEach(t => t.stop())

    const videoConstraints: MediaTrackConstraints & Record<string, unknown> = deviceId
      ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      : { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }

    videoConstraints.focusMode = 'continuous'

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const track = stream.getVideoTracks()[0]
      if (track) {
        const caps = track.getCapabilities?.() as any
        const settings: any = {}
        if (caps?.focusMode?.includes?.('continuous')) settings.focusMode = 'continuous'
        if (caps?.exposureMode?.includes?.('continuous')) settings.exposureMode = 'continuous'
        if (Object.keys(settings).length > 0) {
          try { await track.applyConstraints({ advanced: [settings] }) } catch { /* unsupported */ }
        }
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
        } catch {
          setError('Kamera-Zugriff verweigert')
        }
      } else {
        setError('Kamera-Zugriff verweigert')
      }
    }
  }, [])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    const init = async () => {
      await startCamera()
      scannerRef.current = await createScanner()

      // Wait for autofocus to settle
      await new Promise(r => setTimeout(r, 2000))

      interval = setInterval(async () => {
        if (foundRef.current || !videoRef.current || videoRef.current.readyState < 2 || !scannerRef.current) return
        try {
          const code = await scannerRef.current.scan(videoRef.current)
          if (code && !foundRef.current) {
            handleFound(code)
          }
        } catch { /* continue */ }
      }, 100)
    }

    init()

    return () => {
      clearInterval(interval)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [startCamera, handleFound])

  const switchCamera = async () => {
    if (cameras.length < 2) return
    const nextIdx = (cameraIdx + 1) % cameras.length
    setCameraIdx(nextIdx)
    await startCamera(cameras[nextIdx].deviceId)
  }

  const handleManualSubmit = () => {
    if (barcode.length < 8) return
    handleFound(barcode)
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />

      {error && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-gray-950" />
      )}

      {/* Vignette */}
      {!error && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,0.5)_100%)]" />}

      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 pt-12">
        <button onClick={() => navigate('/')} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
          <ArrowLeft className="h-4 w-4 text-white" />
        </button>
        <span className="text-sm font-medium text-white/90">Scanner</span>
        <div className="flex gap-2">
          {cameras.length > 1 && !error && (
            <button onClick={switchCamera} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
              <SwitchCamera className="h-4 w-4 text-white" />
            </button>
          )}
          <button onClick={() => setShowManual(!showManual)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
            {showManual ? <X className="h-4 w-4 text-white" /> : <Keyboard className="h-4 w-4 text-white" />}
          </button>
        </div>
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {showManual ? (
          <div className="w-64 space-y-3">
            <input
              placeholder="EAN eingeben..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              type="number"
              inputMode="numeric"
              autoFocus
              className="w-full rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 px-4 py-3 text-center text-lg text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleManualSubmit}
              disabled={barcode.length < 8}
              className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              Suchen
            </button>
          </div>
        ) : error ? (
          <div className="text-center space-y-2 px-8">
            <p className="text-sm font-medium text-white">{error}</p>
            <p className="text-xs text-white/60">Aktiviere die Kamera in den Browsereinstellungen.</p>
          </div>
        ) : (
          <div className="relative h-28 w-64" style={{ marginBottom: '120px' }}>
            <div className="absolute left-0 top-0 h-8 w-8 border-l-[3px] border-t-[3px] border-white/90 rounded-tl-2xl" />
            <div className="absolute right-0 top-0 h-8 w-8 border-r-[3px] border-t-[3px] border-white/90 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 h-8 w-8 border-b-[3px] border-l-[3px] border-white/90 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 h-8 w-8 border-b-[3px] border-r-[3px] border-white/90 rounded-br-2xl" />
            <div className="absolute inset-x-3 animate-scan">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-primary/80 to-transparent shadow-[0_0_12px_rgba(5,150,105,0.6)]" />
            </div>
            <p className="absolute -bottom-8 left-0 right-0 text-center text-xs text-white/60">
              Richte die Kamera auf den Barcode
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
