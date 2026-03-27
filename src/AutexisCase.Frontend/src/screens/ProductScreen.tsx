import { useEffect, useRef, useState } from 'react'
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
const SNAP_POINTS = [0.76, 0.94]

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
  alerts: any[]
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

export default function ProductScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { accessToken } = useAppAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  const [snap, setSnap] = useState<number | string | null>(SNAP_POINTS[0])
  const [activeIndex, setActiveIndex] = useState(0)
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0])
  const [scale, setScale] = useState(680)
  const cardsRef = useRef<Array<HTMLButtonElement | null>>([])
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const scrollTimeoutRef = useRef<number | null>(null)
  const currentSnap = typeof snap === 'number' ? snap : SNAP_POINTS[0]
  const drawerProgress =
    (currentSnap - SNAP_POINTS[0]) / (SNAP_POINTS[SNAP_POINTS.length - 1] - SNAP_POINTS[0])
  const clampedDrawerProgress = Math.max(0, Math.min(1, drawerProgress))
  const compactJourney = clampedDrawerProgress > 0.45
  const journeyBottom = `${interpolate(26, 58, clampedDrawerProgress)}vh`
  const journeyCardWidth = `${interpolate(260, 212, clampedDrawerProgress)}px`
  const journeyCardScale = interpolate(1, 0.92, clampedDrawerProgress)

  useEffect(() => {
    if (!accessToken) return
    const id = searchParams.get('id')
    const gtin = searchParams.get('gtin')
    if (!id && !gtin) { setLoading(false); return }

    const url = id ? `/api/Product/${id}` : `/api/Product/gtin/${gtin}`
    fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setProduct(data)
        if (data?.journeyEvents?.length > 0) {
          const first = data.journeyEvents[0]
          setRotation(coordToRotation(first.longitude, first.latitude))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [accessToken, searchParams])

  const events = product?.journeyEvents ?? []

  useEffect(() => {
    if (events.length === 0) return
    const activeEvent = events[activeIndex]
    if (!activeEvent) return
    const targetRotation = coordToRotation(activeEvent.longitude, activeEvent.latitude)
    const startRotation = rotation
    const startScale = scale
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
  }, [activeIndex, events.length])

  const centerActiveCard = (index: number, behavior: ScrollBehavior = 'smooth') => {
    cardsRef.current[index]?.scrollIntoView({
      behavior,
      block: 'nearest',
      inline: 'center',
    })
  }

  const detectClosestCard = () => {
    const container = scrollRef.current
    if (!container) return activeIndex

    const containerRect = container.getBoundingClientRect()
    const containerCenter = containerRect.left + containerRect.width / 2

    let nextIndex = activeIndex
    let closestDistance = Number.POSITIVE_INFINITY

    cardsRef.current.forEach((card, index) => {
      if (!card) return
      const rect = card.getBoundingClientRect()
      const cardCenter = rect.left + rect.width / 2
      const distance = Math.abs(containerCenter - cardCenter)
      if (distance < closestDistance) {
        closestDistance = distance
        nextIndex = index
      }
    })

    if (nextIndex !== activeIndex) setActiveIndex(nextIndex)
    return nextIndex
  }

  const handleCardScroll = () => {
    if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = window.setTimeout(() => {
      const nextIndex = detectClosestCard()
      centerActiveCard(nextIndex)
    }, 90)
  }

  useEffect(() => {
    centerActiveCard(activeIndex, 'auto')
    return () => {
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    centerActiveCard(activeIndex)
  }, [activeIndex])

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
        <Button variant="outline" onClick={() => navigate('/')}>Go back</Button>
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

        <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 pt-12">
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

          <div className="rounded-full border bg-background/95 px-3 py-1 text-xs text-muted-foreground shadow-sm">
            Journey Map
          </div>
        </div>
      </div>

      {events.length > 0 && (
        <div
          className="absolute inset-x-0 z-20 px-4 transition-all duration-300"
          style={{ bottom: journeyBottom }}
        >
          <div
            className="transition-all duration-300"
            style={{ transform: `scale(${journeyCardScale})`, transformOrigin: 'bottom center' }}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Supply Chain Journey
              </p>
              <span className="text-xs text-muted-foreground">
                {activeIndex + 1} / {events.length}
              </span>
            </div>

            <div
              ref={scrollRef}
              onScroll={handleCardScroll}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {events.map((event, index) => (
                <button
                  key={event.id}
                  ref={(element) => { cardsRef.current[index] = element }}
                  onClick={() => setActiveIndex(index)}
                  className="snap-center"
                >
                  <Card
                    size="sm"
                    className={`bg-background/96 text-left shadow-sm transition-all ${
                      index === activeIndex ? 'border-primary ring-2 ring-primary/15' : 'border-border'
                    }`}
                    style={{ width: journeyCardWidth }}
                  >
                    <CardContent className={`space-y-2 ${compactJourney ? 'py-3' : 'py-4'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{event.step}</p>
                          <p className="text-xs text-muted-foreground">{event.location}</p>
                        </div>
                        <div className={`mt-1 h-2.5 w-2.5 rounded-full ${statusDot[event.status] ?? 'bg-primary'}`} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleDateString('de-CH', { month: 'short', year: 'numeric' })}
                        {event.temperature != null && ` · ${event.temperature}°C`}
                      </p>
                      {!compactJourney && event.details && (
                        <p className="text-sm text-foreground/80">{event.details}</p>
                      )}
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Drawer
        open
        modal={false}
        snapPoints={SNAP_POINTS}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
      >
        <DrawerContent className="max-h-[96vh] flex flex-col overflow-hidden">
          <DrawerHeader className="shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <DrawerTitle>{product.name}</DrawerTitle>
                <DrawerDescription>{product.brand} · {product.weight}</DrawerDescription>
              </div>
              <Badge variant={badgeVariant[product.status] ?? 'default'}>
                {statusLabel[product.status] ?? 'OK'}
              </Badge>
            </div>
          </DrawerHeader>

          <div className="flex-1 space-y-4 overflow-y-auto pb-6">
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
                {product.certifications.map(cert => (
                  <Badge key={cert} variant="secondary">{cert}</Badge>
                ))}
              </div>
            )}

            <Separator />

            <div className="space-y-2 px-4">
              <Button className="w-full">Report Issue</Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>Back to Home</Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
