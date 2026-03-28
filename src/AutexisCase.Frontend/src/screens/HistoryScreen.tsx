import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Package, AlertTriangle } from 'lucide-react'
import { scanApi } from '@/api/client'
import type { ScanRecordDto } from '@/api/models/ScanRecordDto'

export default function HistoryScreen() {
  const navigate = useNavigate()
  const [scans, setScans] = useState<ScanRecordDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    scanApi.getRecentScans().then(setScans).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="shrink-0 flex items-center gap-3 px-4 pt-12 pb-3 border-b">
        <button onClick={() => navigate(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Alle Scans</h1>
        <span className="text-xs text-muted-foreground ml-auto">{scans.length} Einträge</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-12">Laden...</p>
        ) : scans.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-12">Noch keine Scans.</p>
        ) : (
          <div className="divide-y">
            {scans.map((s) => {
              const status = String(s.productStatus ?? 'Ok')
              const hasIssue = status === 'Warning' || status === 'Recall' || status === '1' || status === '2'
              return (
                <button
                  key={s.id}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-accent transition-colors"
                  onClick={() => navigate(`/product?id=${s.productId}`)}
                >
                  {s.productImageUrl ? (
                    <img src={s.productImageUrl} alt={s.productName ?? ''} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
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
                  {hasIssue && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
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
