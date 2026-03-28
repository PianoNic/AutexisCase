import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, ChevronRight, RefreshCw } from 'lucide-react'
import { scanApi } from '@/api/client'
import type { ScanRecordDto } from '@/api/models/ScanRecordDto'

export default function AdminProductsScreen() {
  const navigate = useNavigate()
  const [scans, setScans] = useState<ScanRecordDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    scanApi
      .getRecentScans()
      .then(setScans)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 bg-card/80 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <button
            onClick={() => navigate('/admin')}
            className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight">Alle Produkte</h1>
            <p className="text-[11px] text-muted-foreground">{scans.length} Einträge</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <Package className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Noch keine Produkte erfasst.</p>
          </div>
        ) : (
          <div className="divide-y">
            {scans.map((s) => {
              const isOk = s.productStatus === 'Ok'
              const isRecall = s.productStatus === 'Recall'
              return (
                <button
                  key={s.id}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-accent transition-colors"
                  onClick={() => navigate(`/product?id=${s.productId}`)}
                >
                  {s.productImageUrl ? (
                    <img
                      src={s.productImageUrl}
                      alt={s.productName ?? ''}
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.productName}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-muted-foreground">{s.productBrand}</p>
                      {s.scannedAt && (
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(s.scannedAt).toLocaleDateString('de-DE')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      isRecall ? 'bg-red-500' : isOk ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
