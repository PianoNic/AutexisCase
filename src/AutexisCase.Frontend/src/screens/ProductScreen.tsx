import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ComposableMap, Geographies, Geography, Graticule, Line, Marker, Sphere } from 'react-simple-maps'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAppAuth } from '@/auth/use-app-auth'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const SNAP_POINTS = [0.08, 0.55, 0.995]
const EMPTY_EVENTS: JourneyEvent[] = []

interface JourneyEvent {
  id: string
  step: string
  location: string
  latitude: number
  longitude: number
  timestamp: string
  status: number
  icon: string | null
  temperature: number | null
  details: string | null
  co2Kg: number | null
  waterLiters: number | null
  cost: number | null
}

interface Product {
  id: string
  gtin: string
  name: string
  brand: string
  imageUrl: string | null
  category: string | null
  weight: string | null
  origin: string | null
  certifications: string[]
  nutriScore: string | null
  novaGroup: number | null
  ecoScore: string | null
  riskScore: number
  co2Kg: number | null
  waterLiters: number | null
  status: number
  journeyEvents: JourneyEvent[]
  alerts: unknown[]
}

const statusColor: Record<number, string> = {
  0: '#3d6b2e',
  1: '#f59e0b',
  2: '#ef4444',
}

const statusDot: Record<number, string> = {
  0: 'bg-primary',
  1: 'bg-amber-500',
  2: 'bg-destructive',
}

const statusLabel: Record<number, string> = {
  0: 'OK',
  1: 'Warning',
  2: 'Recall',
}

const badgeVariant: Record<number, 'default' | 'secondary' | 'destructive'> = {
  0: 'default',
  1: 'secondary',
  2: 'destructive',
}

function coordToRotation(lon: number, lat: number): [number, number, number] {
  return [-lon, -lat, 0]
}

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function interpolate(start: number, end: number, progress: number) {
  return start + (end - start) * progress
}

function formatEventDate(timestamp: string) {
  return new Date(timestamp).toLocaleDateString('de-CH', {
    month: 'short',
    year: 'numeric',
  })
}

export default function ProductScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { accessToken } = useAppAuth()
  const id = searchParams.get('id')
  const gtin = searchParams.get('gtin')
  const hasLookupTarget = Boolean(id || gtin)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(hasLookupTarget)
  const [snap, setSnap] = useState<number | string | null>(SNAP_POINTS[1])
  const [activeIndex, setActiveIndex] = useState(0)
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0])
  const [scale, setScale] = useState(680)
  const rotationRef = useRef(rotation)
  const scaleRef = useRef(scale)
  const cardsRef = useRef<Array<HTMLButtonElement | null>>([])
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const isScrollSnapping = useRef(false)
  const currentSnap = typeof snap === 'number' ? snap : SNAP_POINTS[1]
  const drawerProgress =
    (currentSnap - SNAP_POINTS[0]) / (SNAP_POINTS[SNAP_POINTS.length - 1] - SNAP_POINTS[0])
  const clampedDrawerProgress = Math.max(0, Math.min(1, drawerProgress))
  const compactJourney = clampedDrawerProgress > 0.35
  const isFullyOpen = currentSnap >= SNAP_POINTS[SNAP_POINTS.length - 1]

  useEffect(() => {
    rotationRef.current = rotation
    scaleRef.current = scale
  }, [rotation, scale])

  useEffect(() => {
    if (!accessToken || !hasLookupTarget) return

    const url = id ? `/api/Product/${id}` : `/api/Product/gtin/${gtin}`
    fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        setProduct(data)
        if (data?.journeyEvents?.length > 0) {
          const firstEvent = data.journeyEvents[0]
          setRotation(coordToRotation(firstEvent.longitude, firstEvent.latitude))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [accessToken, gtin, hasLookupTarget, id])

  const events = product?.journeyEvents ?? EMPTY_EVENTS

  useEffect(() => {
    if (events.length === 0) return

    const activeEvent = events[activeIndex]
    if (!activeEvent) return

    const targetRotation = coordToRotation(activeEvent.longitude, activeEvent.latitude)
    const startRotation = rotationRef.current
    const startScale = scaleRef.current
    const duration = 550
    const startedAt = performance.now()
    let frameId = 0

    const animate = (time: number) => {
      const elapsed = Math.min(1, (time - startedAt) / duration)
      const progress = easeInOutCubic(elapsed)

      setRotation([
        interpolate(startRotation[0], targetRotation[0], progress),
        interpolate(startRotation[1], targetRotation[1], progress),
        0,
      ])
      setScale(interpolate(startScale, 680, progress))

      if (elapsed < 1) {
        frameId = requestAnimationFrame(animate)
      }
    }

    frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameId)
  }, [activeIndex, events])

  const scrollToCard = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const card = cardsRef.current[index]
    const container = scrollRef.current
    if (!card || !container) return

    const cardRect = card.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const scrollLeft =
      container.scrollLeft +
      (cardRect.left - containerRect.left) -
      (containerRect.width / 2 - cardRect.width / 2)

    isScrollSnapping.current = true
    container.scrollTo({ left: scrollLeft, behavior })
    setTimeout(() => {
      isScrollSnapping.current = false
    }, behavior === 'smooth' ? 400 : 50)
  }, [])

  const handleScrollEnd = useCallback(() => {
    if (isScrollSnapping.current) return

    const container = scrollRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const containerCenter = containerRect.left + containerRect.width / 2

    let closestIndex = 0
    let closestDistance = Number.POSITIVE_INFINITY

    cardsRef.current.forEach((card, index) => {
      if (!card) return

      const rect = card.getBoundingClientRect()
      const cardCenter = rect.left + rect.width / 2
      const distance = Math.abs(containerCenter - cardCenter)
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex)
    }
    scrollToCard(closestIndex)
  }, [activeIndex, scrollToCard])

  useEffect(() => {
    if (events.length === 0) return
    scrollToCard(activeIndex, 'auto')
  }, [activeIndex, events.length, scrollToCard])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading product...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Product not found.</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          Go back
        </Button>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-background to-background">
        <div className="pointer-events-none absolute inset-0">
          <ComposableMap
            projection="geoOrthographic"
            projectionConfig={{ rotate: rotation, scale }}
            style={{ width: '100%', height: '100%' }}
          >
            <Sphere id="sphere" fill="#eef7f0" stroke="#cfe3d5" strokeWidth={0.7} />
            <Graticule stroke="#d7e6da" strokeWidth={0.45} />
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: Array<{ rsmKey: string }> }) =>
                geographies.map((geo: { rsmKey: string }) => (
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

            {events.slice(0, -1).map((event, index) => (
              <Line
                key={event.id}
                from={[event.longitude, event.latitude]}
                to={[events[index + 1].longitude, events[index + 1].latitude]}
                stroke={index <= activeIndex ? '#22c55e' : '#b9d2c1'}
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="5 4"
              />
            ))}

            {events.map((event, index) => (
              <Marker key={event.id} coordinates={[event.longitude, event.latitude]}>
                <circle
                  r={index === activeIndex ? 6 : 4.5}
                  fill={event.status === 2 ? '#ef4444' : event.status === 1 ? '#f59e0b' : '#22c55e'}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              </Marker>
            ))}
          </ComposableMap>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/95 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background to-transparent" />

        <div className="pointer-events-auto absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 pt-12">
          <Button
            variant="outline"
            size="icon"
            className="bg-background/95 shadow-sm"
            onClick={() => navigate('/')}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>

          <div className="w-9" />
        </div>
      </div>

      <Drawer
        open
        modal={false}
        snapPoints={SNAP_POINTS}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
      >
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[100dvh] min-h-[100dvh] flex flex-col">
          {events.length > 0 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-full pb-2">
              <div
                ref={scrollRef}
                onScrollEnd={handleScrollEnd}
                onPointerDownCapture={(event) => event.stopPropagation()}
                className="pointer-events-auto flex snap-x snap-mandatory items-center gap-0 overflow-x-auto overscroll-x-contain px-4 py-1 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {events.map((event, index) => (
                  <div key={event.id} className="flex shrink-0 snap-center items-center">
                    {index > 0 && (
                      <div className="flex items-center px-1.5">
                        <div
                          className="h-0.5 w-6 rounded-full transition-colors duration-300"
                          style={{
                            backgroundColor:
                              index <= activeIndex ? statusColor[events[index - 1].status] : '#d1d5db',
                          }}
                        />
                        <svg
                          className="-ml-0.5 h-2 w-1.5 transition-colors duration-300"
                          viewBox="0 0 6 8"
                          fill={index <= activeIndex ? statusColor[events[index - 1].status] : '#d1d5db'}
                        >
                          <path d="M0 0L6 4L0 8Z" />
                        </svg>
                      </div>
                    )}

                    <button
                      ref={(element) => {
                        cardsRef.current[index] = element
                      }}
                      onClick={() => setActiveIndex(index)}
                      className="shrink-0"
                    >
                      <Card
                        size="sm"
                        className={`bg-background/96 text-left shadow-sm transition-all duration-200 ${
                          index === activeIndex
                            ? 'border-primary ring-2 ring-primary/15'
                            : 'border-border'
                        }`}
                        style={{ width: compactJourney ? undefined : '280px' }}
                      >
                        <CardContent className={compactJourney ? 'px-3 py-2' : 'space-y-3 px-4 py-4'}>
                          {compactJourney ? (
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`h-2 w-2 shrink-0 rounded-full ${statusDot[event.status] ?? 'bg-primary'}`}
                              />
                              <span className="text-sm font-medium">{event.step}</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${statusDot[event.status] ?? 'bg-primary'}`}
                                >
                                  {index + 1}
                                </div>
                                <p className="text-sm font-semibold leading-tight">{event.step}</p>
                              </div>

                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{event.location}</span>
                                <span>{formatEventDate(event.timestamp)}</span>
                              </div>

                              {event.details && (
                                <p className="text-[13px] leading-snug text-foreground/75">
                                  {event.details}
                                </p>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </button>
                  </div>
                ))}

                <div className="w-[40%] shrink-0" />
              </div>
            </div>
          )}

          <DrawerHeader className="shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <DrawerTitle>{product.name}</DrawerTitle>
                <DrawerDescription>
                  {product.brand}
                  {product.weight ? ` · ${product.weight}` : ''}
                </DrawerDescription>
              </div>
              <Badge variant={badgeVariant[product.status] ?? 'default'}>
                {statusLabel[product.status] ?? 'OK'}
              </Badge>
            </div>
          </DrawerHeader>

          <div
            className={`flex-1 space-y-4 overscroll-y-contain pb-[max(1.5rem,env(safe-area-inset-bottom))] ${
              isFullyOpen ? 'overflow-y-auto' : 'overflow-hidden'
            }`}
          >
            <div className="grid grid-cols-3 gap-2 px-4">
              {[
                { label: 'Origin', value: product.origin ?? '-' },
                { label: 'Nutri-Score', value: product.nutriScore ?? '-' },
                { label: 'CO₂', value: product.co2Kg != null ? `${product.co2Kg} kg` : '-' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-muted px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="mt-0.5 text-sm font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>

            {product.certifications.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-4">
                {product.certifications.map((certification) => (
                  <Badge key={certification} variant="secondary">
                    {certification}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            <div className="space-y-1 px-4">
              <h3 className="text-sm font-semibold">Ingredients</h3>
              <p className="text-sm text-muted-foreground">
                Cocoa mass, sugar, cocoa butter, vanilla extract. Cocoa solids: 70% minimum.
              </p>
            </div>

            <Separator />

            <div className="space-y-2 px-4">
              <h3 className="text-sm font-semibold">Nutrition Facts</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {[
                  { label: 'Energy', value: '2,310 kJ / 556 kcal' },
                  { label: 'Fat', value: '41 g' },
                  { label: 'Saturated Fat', value: '25 g' },
                  { label: 'Carbohydrates', value: '33 g' },
                  { label: 'Sugars', value: '27 g' },
                  { label: 'Protein', value: '10 g' },
                  { label: 'Salt', value: '0.03 g' },
                  { label: 'Fibre', value: '11 g' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between border-b border-border/50 py-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2 px-4">
              <h3 className="text-sm font-semibold">Ecological Footprint</h3>
              <div className="rounded-xl bg-muted p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">CO₂ per 100g</span>
                  <span className="font-medium">
                    {product.co2Kg != null ? `${product.co2Kg} kg CO₂e` : '-'}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
                  <div className="h-full w-[45%] rounded-full bg-amber-500" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Moderate impact
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 px-4 pb-6">
              <Button className="w-full">Report Issue</Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
