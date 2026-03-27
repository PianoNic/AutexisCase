import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Keyboard, X } from 'lucide-react'
import { getProductByGtin } from '@/data/mock'

export default function ScanScreen() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [barcode, setBarcode] = useState('')
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    let stream: MediaStream | null = null
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
      })
      .catch(() => setPermissionDenied(true))
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const handleScan = () => {
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      navigate('/product/tomatoes')
    }, 1200)
  }

  const handleManualSubmit = () => {
    if (barcode.length < 8) return
    const product = getProductByGtin(barcode)
    navigate(product ? `/product/${product.id}` : '/product/chocolate')
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />

      {permissionDenied && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-gray-950" />
      )}

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,0.5)_100%)]" />

      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 pt-12">
        <button
          onClick={() => navigate('/')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4 text-white" />
        </button>
        <span className="text-sm font-medium text-white/90">Scanner</span>
        <button
          onClick={() => setShowManual(!showManual)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
        >
          {showManual ? <X className="h-4 w-4 text-white" /> : <Keyboard className="h-4 w-4 text-white" />}
        </button>
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {showManual ? (
          /* Manual entry */
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
        ) : (
          /* Scanner frame */
          <div className="relative h-56 w-56">
            <div className="absolute left-0 top-0 h-10 w-10 border-l-[3px] border-t-[3px] border-white/90 rounded-tl-2xl" />
            <div className="absolute right-0 top-0 h-10 w-10 border-r-[3px] border-t-[3px] border-white/90 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 h-10 w-10 border-b-[3px] border-l-[3px] border-white/90 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 h-10 w-10 border-b-[3px] border-r-[3px] border-white/90 rounded-br-2xl" />

            <div className="absolute inset-x-3 animate-scan">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-primary/80 to-transparent shadow-[0_0_12px_rgba(5,150,105,0.6)]" />
            </div>

            <button onClick={handleScan} className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              {scanning ? (
                <>
                  <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/20 border-t-primary" />
                  <span className="text-xs font-medium text-white">Erkenne Barcode...</span>
                </>
              ) : (
                <span className="text-xs text-white/60">Zum Scannen tippen</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
