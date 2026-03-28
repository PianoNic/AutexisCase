import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  Line,
  Marker,
  Sphere,
} from 'react-simple-maps'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { ArrowLeft, ArrowRight, Thermometer, ShieldCheck, Leaf, TreePine, Award, Sprout, Flag } from 'lucide-react'
import { productApi } from '@/api/client'
import type { ProductDto } from '@/api/models/ProductDto'
import type { BatchDto } from '@/api/models/BatchDto'
import type { JourneyEventDto } from '@/api/models/JourneyEventDto'
import { getShelfLifePrediction, getAnomalyDetection, getSustainabilityAnalysis, getProductAlternatives } from '@/data/mock-ai'
import { ShelfLifeCard } from '@/components/product/ShelfLifeCard'
import { AlternativesCard } from '@/components/product/AlternativesCard'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-lime-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-500',
}

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t
}

export default function ProductScreen() {
  const { id: routeId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const qId = searchParams.get('id')
  const qGtin = searchParams.get('gtin')
  const qLot = searchParams.get('lot')

  const [product, setProduct] = useState<ProductDto | null>(null)
  const [batch, setBatch] = useState<BatchDto | null>(null)
  const [loading, setLoading] = useState(true)

  // AI features still use mock data (no backend endpoints yet)
  const productId = product?.id ?? routeId ?? qId ?? ''
  const shelfLife = getShelfLifePrediction(productId)
  const anomalyResult = getAnomalyDetection(productId)
  const sustainability = getSustainabilityAnalysis(productId)
  const alternatives = getProductAlternatives(productId)

  useEffect(() => {
    setLoading(true)
    setBatch(null)
    setProduct(null)

    const loadProduct = async () => {
      try {
        let p: ProductDto | null = null

        if (routeId) {
          p = await productApi.getProductById({ id: routeId })
        } else if (qId) {
          p = await productApi.getProductById({ id: qId })
        } else if (qGtin) {
          p = await productApi.getProductByGtin({ gtin: qGtin })
        }

        if (!p) { setLoading(false); return }
        setProduct(p)

        // If lot number provided, look up specific batch
        if (qLot && qGtin) {
          try {
            const b = await productApi.lookupBatch({ gtin: qGtin, lot: qLot })
            setBatch(b)
          } catch {
            // Fall back to first batch
            const firstBatch = p.batches?.[0]
            if (firstBatch?.id) {
              try { setBatch(await productApi.getBatchById({ batchId: firstBatch.id })) } catch {}
            }
          }
        } else {
          const firstBatch = p.batches?.[0]
          if (firstBatch?.id) {
            try { setBatch(await productApi.getBatchById({ batchId: firstBatch.id })) } catch {}
          }
        }
      } catch {}
      setLoading(false)
    }

    loadProduct()
  }, [routeId, qId, qGtin, qLot])

  const [activeIndex, setActiveIndex] = useState(0)
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0])
  const [scale, setScale] = useState(600)
  const [reportStep, setReportStep] = useState<'closed' | 'reason' | 'detail'>('closed')
  const [reportReason, setReportReason] = useState('')
  const [reportDetail, setReportDetail] = useState('')
  const [reportSent, setReportSent] = useState(false)

  const coldChainOk = batch ? batch.status === 0 : true // 0 = Ok, 1 = Warning, 2 = Recall
  const peekSnap = !coldChainOk ? '180px' : '140px'
  const midSnap = '330px'
  const snapPoints: (string | number)[] = [peekSnap, midSnap, 1]
  const [snap, setSnap] = useState<number | string | null>(midSnap)

  const events: JourneyEventDto[] = batch?.journeyEvents ?? []

  // Compute map rotation from journey coordinates
  useEffect(() => {
    if (events.length > 0) {
      const first = events[0]
      setRotation([-(first.longitude ?? 0), -(first.latitude ?? 0), 0])
      setScale(800)
    }
  }, [batch])

  useEffect(() => {
    if (events.length === 0) return
    const target = events[activeIndex] ?? events[events.length - 1]
    const startRotation: [number, number, number] = [...rotation]
    const startScale = scale
    const duration = 500
    const startedAt = performance.now()
    let frameId = 0

    const animate = (time: number) => {
      const elapsed = Math.min(1, (time - startedAt) / duration)
      const t = easeInOutCubic(elapsed)

      setRotation([
        lerp(startRotation[0], -(target.longitude ?? 0), t),
        lerp(startRotation[1], -(target.latitude ?? 0), t),
        0,
      ])
      setScale(lerp(startScale, 800, t))

      if (elapsed < 1) {
        frameId = requestAnimationFrame(animate)
      }
    }

    frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameId)
  }, [activeIndex])

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Laden...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <p className="font-medium">Produkt nicht gefunden</p>
        <button onClick={() => navigate('/')} className="text-sm text-primary underline mt-2">
          Zurück
        </button>
      </div>
    )
  }

  const tempData = batch?.temperatureLogs ?? []
  const anomalies = anomalyResult?.anomalies ?? []
  const alerts = batch?.alerts ?? []

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {/* Full-screen map background */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-background to-background">
        <div className="pointer-events-none absolute inset-0">
          <ComposableMap
            projection="geoOrthographic"
            projectionConfig={{ rotate: rotation, scale }}
            style={{ width: '100%', height: '100%' }}
          >
            <Sphere id="sphere" fill="#eef7f0" stroke="#cfe3d5" strokeWidth={0.7} />
            <Graticule stroke="#d7e6da" strokeWidth={0.4} />
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#dcebdd"
                    stroke="#bfd4c4"
                    strokeWidth={0.45}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {events.slice(0, -1).map((event, i) => (
              <Line
                key={event.id}
                from={[event.longitude ?? 0, event.latitude ?? 0]}
                to={[events[i + 1].longitude ?? 0, events[i + 1].latitude ?? 0]}
                stroke={i <= activeIndex ? '#16a34a' : '#94b8a0'}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="5 4"
              />
            ))}

            {events.map((event, i) => (
              <Marker key={event.id} coordinates={[event.longitude ?? 0, event.latitude ?? 0]}>
                <circle
                  r={i === activeIndex ? 8 : 5.5}
                  fill={
                    event.status === 2 // Warning
                      ? '#f59e0b'
                      : i === activeIndex
                        ? '#16a34a'
                        : '#86efac'
                  }
                  stroke="#ffffff"
                  strokeWidth={2.5}
                />
              </Marker>
            ))}
          </ComposableMap>
        </div>

        {/* Top fade */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/90 to-transparent" />

        {/* Floating back + product name */}
        <div className="absolute left-0 right-0 top-0 z-20 flex items-center gap-3 px-4 pt-12">
          <button
            onClick={() => navigate('/')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background/90 border shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="rounded-full bg-background/90 border shadow-sm px-3 py-1.5">
            <span className="text-xs font-semibold truncate">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Drawer */}
      <Drawer
        open
        modal={false}
        snapPoints={snapPoints}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
        dismissible={false}
        noBodyStyles
        snapToSequentialPoint
      >
        <DrawerContent showOverlay={false} className="flex flex-col overflow-hidden h-full !max-h-[calc(100%-6rem)]">
          <DrawerHeader className="shrink-0 pb-2">
            <DrawerTitle className="text-sm font-semibold text-muted-foreground">
              {product.brand} · {product.weight}
            </DrawerTitle>
            {!coldChainOk && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 mt-1">
                <Thermometer className="h-3.5 w-3.5 shrink-0" />
                <p className="text-[10px]">Kühlketten-Abweichung erkannt.</p>
              </div>
            )}
          </DrawerHeader>

          <div
            className="flex-1 pb-16"
            style={{ overflow: snap === 1 ? 'auto' : 'hidden' }}
          >
            <div className="px-4 space-y-4">
              {/* Badges */}
              <div className="space-y-2">
                {product.origin && (
                  <div className="rounded-xl border px-3 py-2 flex items-center gap-3">
                    <p className="text-[10px] text-muted-foreground shrink-0">Herkunft</p>
                    <div className="flex items-center justify-between flex-1 text-xs font-semibold">
                      {product.origin.split('→').map((step, i, arr) => (
                        <span key={i} className="contents">
                          {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                          <span>{step.trim()}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {product.nutriScore && (
                    <div className="rounded-xl border px-3 py-1.5 text-center">
                      <p className="text-[10px] text-muted-foreground leading-tight">Nutri-Score</p>
                      <span className={`inline-block mt-0.5 rounded px-2 py-0.5 text-xs font-bold text-white ${GRADE_COLORS[product.nutriScore]}`}>
                        {product.nutriScore}
                      </span>
                    </div>
                  )}
                  {sustainability && (
                    <Badge label="CO₂" value={`${sustainability.totalCo2Kg} kg`} />
                  )}
                  {tempData.length > 0 && (
                    <Badge
                      label="Kühlkette"
                      value={coldChainOk ? 'Intakt' : 'Abweichung'}
                      variant={coldChainOk ? 'ok' : 'warn'}
                    />
                  )}
                </div>
              </div>

              {/* Certifications */}
              {(product.certifications ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(product.certifications ?? []).map(c => (
                    <span key={c} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-[11px] font-semibold text-emerald-800">
                      {certIcon(c)}
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {/* Nutrition */}
              {product.nutrition && (
                <section>
                  <p className="text-sm font-semibold mb-2">Nährwerte</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
                    <Row label="Energie" value={`${product.nutrition.energyKcal} kcal`} />
                    <Row label="Fett" value={`${product.nutrition.fat ?? 0} g`} />
                    <Row label="Ges. Fettsäuren" value={`${product.nutrition.saturatedFat ?? 0} g`} />
                    <Row label="Kohlenhydrate" value={`${product.nutrition.sugars ?? 0} g`} />
                    <Row label="Eiweiß" value={`${product.nutrition.protein ?? 0} g`} />
                    <Row label="Salz" value={`${product.nutrition.salt ?? 0} g`} />
                    <Row label="Ballaststoffe" value={`${product.nutrition.fiber ?? 0} g`} />
                  </div>
                </section>
              )}

              {/* Shelf life */}
              {shelfLife && <ShelfLifeCard prediction={shelfLife} />}

              {/* Anomalies — only if there are issues */}
              {anomalies.length > 0 && (
                <section>
                  {anomalies.map((a) => (
                    <div key={a.id} className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-amber-800">
                      <p className="text-xs font-semibold">{a.title}</p>
                      <p className="text-[11px] mt-0.5">{a.description}</p>
                    </div>
                  ))}
                </section>
              )}

              {/* Ecological footprint — simplified */}
              {sustainability && (
                <section>
                  <p className="text-sm font-semibold mb-2">Ökologischer Fußabdruck</p>
                  <div className="space-y-1.5 text-[13px]">
                    <Row label="CO₂ pro 100 g" value={`${sustainability.totalCo2Kg} kg`} />
                    <Row label="Wasserverbrauch" value={`${sustainability.waterFootprintL} L`} />
                    <Row label="Transportweg" value={`${sustainability.transportDistanceKm.toLocaleString()} km`} />
                  </div>
                  <p className={`text-xs mt-1.5 ${sustainability.comparisonToAverage < 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {sustainability.comparisonToAverage < 0
                      ? `${Math.abs(sustainability.comparisonToAverage)}% unter Durchschnitt`
                      : `${sustainability.comparisonToAverage}% über Durchschnitt`}
                  </p>
                </section>
              )}

              {/* Alternatives */}
              {alternatives && <AlternativesCard data={alternatives} />}

              {/* Report issue */}
              {reportSent ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5">
                  <p className="text-xs font-semibold text-emerald-800">Meldung gesendet — Danke!</p>
                </div>
              ) : (
                <button
                  onClick={() => setReportStep('reason')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-semibold text-red-700 active:bg-red-100"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Problem melden
                </button>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Report sheet — step 1: pick reason */}
      {reportStep === 'reason' && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReportStep('closed')} />
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl bg-background p-5 space-y-4">
            <div className="mx-auto h-1 w-10 rounded-full bg-muted" />
            <div className="text-center">
              <Flag className="h-6 w-6 text-red-500 mx-auto mb-1" />
              <p className="text-base font-semibold">Problem melden</p>
              <p className="text-xs text-muted-foreground mt-0.5">{product.name}</p>
            </div>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => { setReportReason(r); setReportStep('detail') }}
                  className="flex w-full items-center rounded-xl border px-3 py-2.5 text-sm active:bg-muted transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
            <button onClick={() => setReportStep('closed')} className="w-full py-2 text-sm text-muted-foreground">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Report sheet — step 2: add details */}
      {reportStep === 'detail' && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReportStep('closed')} />
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl bg-background p-5 space-y-4">
            <div className="mx-auto h-1 w-10 rounded-full bg-muted" />
            <div className="text-center">
              <p className="text-base font-semibold">{reportReason}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Beschreibe das Problem{reportReason !== 'Sonstiges' ? ' (optional)' : ''}</p>
            </div>
            <textarea
              value={reportDetail}
              onChange={(e) => setReportDetail(e.target.value)}
              placeholder="Was ist passiert?"
              rows={4}
              autoFocus
              className="w-full rounded-xl border px-3 py-3 text-sm outline-none resize-none focus:ring-1 focus:ring-red-400"
            />
            <button
              onClick={() => { setReportSent(true); setReportStep('closed') }}
              disabled={reportReason === 'Sonstiges' && !reportDetail.trim()}
              className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white disabled:opacity-30"
            >
              Absenden
            </button>
            <button onClick={() => setReportStep('reason')} className="w-full py-2 text-sm text-muted-foreground">
              Zurück
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const REPORT_REASONS = ['Falsche Produktangaben', 'Kühlketten-Problem', 'Beschädigung', 'Abgelaufen', 'Sonstiges']

/* ── Helpers ── */

const CERT_ICONS: Record<string, React.ReactNode> = {
  'Fairtrade': <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />,
  'Rainforest Alliance': <TreePine className="h-3.5 w-3.5 text-emerald-600" />,
  'EU Bio': <Leaf className="h-3.5 w-3.5 text-emerald-600" />,
  'Demeter': <Sprout className="h-3.5 w-3.5 text-emerald-600" />,
}

function certIcon(name: string) {
  return CERT_ICONS[name] ?? <Award className="h-3.5 w-3.5 text-emerald-600" />
}

function Badge({ label, value, variant }: { label: string; value: string; variant?: 'ok' | 'warn' }) {
  const ring = variant === 'ok'
    ? 'border-emerald-200'
    : variant === 'warn'
      ? 'border-amber-200'
      : 'border-border'
  return (
    <div className={`rounded-xl border ${ring} px-3 py-1.5 text-center`}>
      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
      <p className="text-xs font-semibold leading-tight mt-0.5">{value}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}
