import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Map, { Layer, Marker as MapMarker, Source } from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
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

const MAP_STYLE_URL = 'https://maps.black/styles/openstreetmap-protomaps/protomaps/grayscale/style.json'

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-lime-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-500',
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
  const [reportStep, setReportStep] = useState<'closed' | 'reason' | 'detail'>('closed')
  const [reportReason, setReportReason] = useState('')
  const [reportDetail, setReportDetail] = useState('')
  const [reportSent, setReportSent] = useState(false)

  const mapRef = useRef<MapRef>(null)
  const cardScrollRef = useRef<HTMLDivElement>(null)

  const coldChainOk = batch ? batch.status === 0 : true // 0 = Ok, 1 = Warning, 2 = Recall
  const peekSnap = !coldChainOk ? '180px' : '140px'
  const midSnap = '330px'
  const snapPoints: (string | number)[] = [peekSnap, midSnap, 1]
  const [snap, setSnap] = useState<number | string | null>(midSnap)

  const events: JourneyEventDto[] = batch?.journeyEvents ?? []

  // Build GeoJSON line between events
  const routeGeoJson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: events.length > 1
      ? [
          // Completed segments (green)
          ...(activeIndex > 0
            ? [{
                type: 'Feature' as const,
                properties: { segment: 'completed' },
                geometry: {
                  type: 'LineString' as const,
                  coordinates: events.slice(0, activeIndex + 1).map(e => [e.longitude ?? 0, e.latitude ?? 0]),
                },
              }]
            : []),
          // Upcoming segments (gray)
          ...(activeIndex < events.length - 1
            ? [{
                type: 'Feature' as const,
                properties: { segment: 'upcoming' },
                geometry: {
                  type: 'LineString' as const,
                  coordinates: events.slice(activeIndex).map(e => [e.longitude ?? 0, e.latitude ?? 0]),
                },
              }]
            : []),
        ]
      : [],
  }

  // Animate camera to active event
  useEffect(() => {
    if (events.length === 0 || !mapRef.current) return
    const target = events[activeIndex] ?? events[events.length - 1]
    const prev = activeIndex > 0 ? events[activeIndex - 1] : undefined
    const next = activeIndex < events.length - 1 ? events[activeIndex + 1] : undefined
    const refs = [prev, next].filter(Boolean) as JourneyEventDto[]
    let zoom = 8
    if (refs.length > 0) {
      const span = Math.max(...refs.map(r => Math.max(Math.abs((r.latitude ?? 0) - (target.latitude ?? 0)), Math.abs((r.longitude ?? 0) - (target.longitude ?? 0)))))
      if (span <= 0.2) zoom = 12
      else if (span <= 0.75) zoom = 11
      else if (span <= 2) zoom = 9.5
      else if (span <= 6) zoom = 7.5
      else if (span <= 16) zoom = 6
      else zoom = 4.5
    }
    mapRef.current.easeTo({
      center: [target.longitude ?? 0, target.latitude ?? 0],
      zoom,
      pitch: 45,
      duration: 1200,
      easing: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    })
  }, [activeIndex, events])

  // Fit map to all events on first load
  const onMapLoad = useCallback(() => {
    if (events.length === 0 || !mapRef.current) return
    const map = mapRef.current
    if (events.length === 1) {
      map.easeTo({ center: [events[0].longitude ?? 0, events[0].latitude ?? 0], zoom: 4, duration: 0 })
    } else {
      const lngs = events.map(e => e.longitude ?? 0)
      const lats = events.map(e => e.latitude ?? 0)
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 60, duration: 0 },
      )
    }
  }, [events])

  // Handle journey card scroll to update activeIndex
  const onCardScroll = useCallback(() => {
    const el = cardScrollRef.current
    if (!el || events.length === 0) return
    const containerRect = el.getBoundingClientRect()
    const center = containerRect.left + containerRect.width / 2
    let closestIdx = 0
    let closestDist = Infinity
    // Skip first and last children (spacers)
    for (let i = 1; i < el.children.length - 1; i++) {
      const child = el.children[i]
      const rect = child.getBoundingClientRect()
      const dist = Math.abs(rect.left + rect.width / 2 - center)
      if (dist < closestDist) {
        closestDist = dist
        closestIdx = i - 1
      }
    }
    if (closestIdx !== activeIndex) setActiveIndex(closestIdx)
  }, [events, activeIndex])

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
      {/* Full-screen MapLibre map background */}
      <div className="absolute inset-0" data-vaul-no-drag>
        <Map
          ref={mapRef}
          reuseMaps
          mapStyle={MAP_STYLE_URL}
          style={{ width: '100%', height: '100%' }}
          initialViewState={{
            longitude: events[0]?.longitude ?? 8.3,
            latitude: events[0]?.latitude ?? 47.2,
            zoom: 3.4,
            pitch: 35,
            bearing: 0,
          }}
          onLoad={onMapLoad}
          attributionControl={false}
        >
          {/* Route lines */}
          <Source id="route" type="geojson" data={routeGeoJson}>
            <Layer
              id="route-completed"
              type="line"
              filter={['==', ['get', 'segment'], 'completed']}
              paint={{ 'line-color': '#16a34a', 'line-width': 3, 'line-dasharray': [2, 1.5] }}
            />
            <Layer
              id="route-upcoming"
              type="line"
              filter={['==', ['get', 'segment'], 'upcoming']}
              paint={{ 'line-color': '#94b8a0', 'line-width': 2, 'line-dasharray': [2, 1.5] }}
            />
          </Source>

          {/* Event markers */}
          {events.map((event, i) => (
            <MapMarker
              key={event.id}
              longitude={event.longitude ?? 0}
              latitude={event.latitude ?? 0}
              anchor="center"
              onClick={() => setActiveIndex(i)}
            >
              <div
                className="rounded-full border-2 border-white shadow"
                style={{
                  width: i === activeIndex ? 18 : 12,
                  height: i === activeIndex ? 18 : 12,
                  backgroundColor:
                    event.status === 2
                      ? '#f59e0b'
                      : i === activeIndex
                        ? '#16a34a'
                        : '#86efac',
                  transition: 'all 0.2s ease',
                }}
              />
            </MapMarker>
          ))}
        </Map>

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
        <DrawerContent showOverlay={false} className="flex flex-col !max-h-[calc(100%-6rem)] min-h-[100dvh] bg-popover before:hidden data-[vaul-drawer-direction=bottom]:mt-0">
          {/* Journey step cards above the drawer handle */}
          {events.length > 0 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-full pb-2 z-10">
              <div
                ref={cardScrollRef}
                onScroll={onCardScroll}
                onPointerDownCapture={(e) => e.stopPropagation()}
                className="pointer-events-auto flex gap-2 overflow-x-auto snap-x snap-mandatory px-4 touch-pan-x"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="w-[35%] shrink-0" />
                {events.map((event, i) => {
                  const isActive = i === activeIndex
                  const dateStr = event.timestamp
                    ? new Date(event.timestamp).toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: '2-digit' })
                    : ''
                  return (
                    <button
                      key={event.id}
                      onClick={() => {
                        setActiveIndex(i)
                        cardScrollRef.current?.children[i + 1]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
                      }}
                      className={`snap-center shrink-0 rounded-xl border px-3 py-2 text-left transition-all ${
                        isActive
                          ? 'bg-background border-emerald-300 shadow-md'
                          : 'bg-background/80 border-border/60'
                      }`}
                      style={{ minWidth: 140, maxWidth: 170 }}
                    >
                      <p className={`text-[11px] font-semibold truncate ${isActive ? 'text-emerald-700' : 'text-foreground'}`}>
                        {event.step ?? `Schritt ${i + 1}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{event.location}</p>
                      {dateStr && <p className="text-[9px] text-muted-foreground mt-0.5">{dateStr}</p>}
                    </button>
                  )
                })}
                <div className="w-[35%] shrink-0" />
              </div>
            </div>
          )}

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
