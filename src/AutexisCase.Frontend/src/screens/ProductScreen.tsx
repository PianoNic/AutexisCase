import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FeatureCollection, LineString } from "geojson";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  CargoShipIcon,
  CoffeeBeansIcon,
  ContainerTruckIcon,
  DeliveryTruck02Icon,
  DropletIcon,
  Factory02Icon,
  Leaf02Icon,
  Location02Icon,
  MilkCartonIcon,
  NaturalFoodIcon,
  Navigation03Icon,
  OrganicFoodIcon,
  Package02Icon,
  StoreLocation02Icon,
  WarehouseIcon,
} from "@hugeicons/core-free-icons";
import maplibregl from "maplibre-gl";
import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import Map, { Layer, Marker, Source } from "react-map-gl/maplibre";
import { ArrowRight, Thermometer, ShieldCheck, Leaf, TreePine, Award, Sprout, Flag } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { productApi, getJourneyEventDescription } from "@/api/client";
import type { ProductDto } from "@/api/models/ProductDto";
import type { BatchDto } from "@/api/models/BatchDto";
import type { JourneyEventDto } from "@/api/models/JourneyEventDto";
import type { ShelfLifePredictionDto } from "@/api/models/ShelfLifePredictionDto";
import type { AnomalyDetectionResultDto } from "@/api/models/AnomalyDetectionResultDto";
import type { SustainabilityAnalysisDto } from "@/api/models/SustainabilityAnalysisDto";
import type { ProductAlternativesDto } from "@/api/models/ProductAlternativesDto";
import { ShelfLifeCard } from "@/components/product/ShelfLifeCard";
import { AnomalyCard } from "@/components/product/AnomalyCard";
import { SustainabilityDetailCard } from "@/components/product/SustainabilityDetailCard";
import { AlternativesCard } from "@/components/product/AlternativesCard";
import { BlockchainCard } from "@/components/product/BlockchainCard";
import { ProductChat } from "@/components/product/ProductChat";

const MAP_STYLE_URL =
  "https://maps.black/styles/openstreetmap-protomaps/protomaps/grayscale/style.json";
const SNAP_POINTS = [0.08, 0.55, 0.87];
type MapPoint = [number, number];
type MapCamera = {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
};
const DEFAULT_CAMERA: MapCamera = {
  longitude: 8.3,
  latitude: 47.2,
  zoom: 3.4,
  bearing: 0,
  pitch: 35,
};

interface JourneyWaypoint {
  id?: string | null;
  latitude: number;
  longitude: number;
  label?: string | null;
  icon?: string | null;
  transportType?: string | null;
}

// Extend generated type with fields the map needs
type JourneyEvent = JourneyEventDto & {
  transportType?: string | null;
  waypoints?: JourneyWaypoint[] | null;
};

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-500",
  B: "bg-lime-500",
  C: "bg-yellow-500",
  D: "bg-orange-500",
  E: "bg-red-500",
};

const journeyStatusColor: Record<string, string> = {
  Completed: "#3d6b2e",
  Current: "#f59e0b",
  Warning: "#ef4444",
};

const journeyStatusDot: Record<string, string> = {
  Completed: "bg-primary",
  Current: "bg-amber-500",
  Warning: "bg-destructive",
};

const REPORT_REASONS = ["Falsche Produktangaben", "Kühlketten-Problem", "Beschädigung", "Abgelaufen", "Sonstiges"];

const CERT_ICONS: Record<string, React.ReactNode> = {
  Fairtrade: <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />,
  "Rainforest Alliance": <TreePine className="h-3.5 w-3.5 text-emerald-600" />,
  "EU Bio": <Leaf className="h-3.5 w-3.5 text-emerald-600" />,
  Demeter: <Sprout className="h-3.5 w-3.5 text-emerald-600" />,
};

function certIcon(name: string) {
  return CERT_ICONS[name] ?? <Award className="h-3.5 w-3.5 text-emerald-600" />;
}

function getStatusString(status: string | number | undefined): string {
  if (status === "Warning" || status === 2) return "Warning";
  if (status === "Current" || status === 1) return "Current";
  return "Completed";
}

function getMarkerFill(status: string) {
  if (status === "Warning") return "#ef4444";
  if (status === "Current") return "#f59e0b";
  return "#22c55e";
}

function getZoomForEvent(
  event: JourneyEvent,
  previousEvent?: JourneyEvent,
  nextEvent?: JourneyEvent,
) {
  const referencePoints = [previousEvent, nextEvent].filter(Boolean) as JourneyEvent[];
  if (referencePoints.length === 0) return 11.5;

  const span = Math.max(
    ...referencePoints.map((point) =>
      Math.max(
        Math.abs(point.latitude - event.latitude),
        Math.abs(point.longitude - event.longitude),
      ),
    ),
  );

  if (span <= 0.08) return 13.6;
  if (span <= 0.2) return 12.7;
  if (span <= 0.75) return 11.2;
  if (span <= 2) return 9.6;
  if (span <= 6) return 7.9;
  if (span <= 16) return 6.1;
  return 4.6;
}

function getBearingForEvent(
  previousEvent: JourneyEvent | undefined,
  nextEvent: JourneyEvent | undefined,
) {
  const start = previousEvent ?? nextEvent;
  const end = nextEvent ?? previousEvent;
  if (!start || !end) return 0;

  const deltaLon = end.longitude - start.longitude;
  const deltaLat = end.latitude - start.latitude;
  if (deltaLon === 0 && deltaLat === 0) return 0;

  return (Math.atan2(deltaLon, deltaLat) * 180) / Math.PI;
}

function getCameraForEvent(
  event: JourneyEvent,
  previousEvent?: JourneyEvent,
  nextEvent?: JourneyEvent,
): MapCamera {
  return {
    longitude: event.longitude,
    latitude: event.latitude,
    zoom: getZoomForEvent(event, previousEvent, nextEvent),
    bearing: getBearingForEvent(previousEvent, nextEvent),
    pitch: 48,
  };
}

function getEventIcon(event: JourneyEvent) {
  const signature = `${event.icon ?? ""} ${event.step ?? ""} ${event.location ?? ""}`.toLowerCase();

  if (getStatusString(event.status) === "Warning" || signature.includes("rückruf") || signature.includes("recall")) return AlertCircleIcon;
  if (signature.includes("kakao") || signature.includes("cocoa") || signature.includes("bohne") || signature.includes("bean")) return CoffeeBeansIcon;
  if (signature.includes("pistazie") || signature.includes("haselnuss") || signature.includes("nuss") || signature.includes("nut")) return NaturalFoodIcon;
  if (signature.includes("ernte") || signature.includes("harvest") || signature.includes("farm") || signature.includes("feld")) return Leaf02Icon;
  if (signature.includes("milch") || signature.includes("milk") || signature.includes("dairy") || signature.includes("emmi")) return MilkCartonIcon;
  if (signature.includes("beschaffung") || signature.includes("sourcing") || signature.includes("einkauf")) return OrganicFoodIcon;
  if (signature.includes("verarbeitung") || signature.includes("factory") || signature.includes("produktion") || signature.includes("chocolat") || signature.includes("frey")) return Factory02Icon;
  if (signature.includes("seetransport") || signature.includes("schiff") || signature.includes("ship") || signature.includes("sea") || signature.includes("mittelmeer")) return CargoShipIcon;
  if (signature.includes("autobahn") || signature.includes("transport") || signature.includes("truck") || signature.includes("road")) return ContainerTruckIcon;
  if (signature.includes("zentrallager") || signature.includes("lager") || signature.includes("warehouse") || signature.includes("mvb")) return WarehouseIcon;
  if (signature.includes("verpackung") || signature.includes("package") || signature.includes("pack")) return Package02Icon;
  if (signature.includes("regal") || signature.includes("store") || signature.includes("coop") || signature.includes("migros") || signature.includes("laden")) return StoreLocation02Icon;
  if (signature.includes("wasser") || signature.includes("water") || signature.includes("reinigung")) return DropletIcon;

  return Location02Icon;
}

function getTransportIcon(
  transportType: string | null | undefined,
  fallbackEvent: JourneyEvent,
) {
  const signature =
    `${transportType ?? ""} ${fallbackEvent.icon ?? ""} ${fallbackEvent.step ?? ""}`.toLowerCase();

  if (
    signature.includes("ship") ||
    signature.includes("sea") ||
    signature.includes("boat") ||
    signature.includes("cargo")
  ) {
    return CargoShipIcon;
  }
  if (signature.includes("milk")) {
    return MilkCartonIcon;
  }
  if (signature.includes("factory") || signature.includes("processing")) {
    return Factory02Icon;
  }
  if (signature.includes("warehouse") || signature.includes("lager")) {
    return WarehouseIcon;
  }
  if (signature.includes("store") || signature.includes("regal")) {
    return StoreLocation02Icon;
  }
  if (signature.includes("transport") || signature.includes("truck") || signature.includes("road")) {
    return DeliveryTruck02Icon;
  }

  return Navigation03Icon;
}

function getWaypointPoints(event: JourneyEvent) {
  return (event.waypoints ?? []).filter(
    (waypoint) =>
      waypoint &&
      Number.isFinite(waypoint.latitude) &&
      Number.isFinite(waypoint.longitude),
  );
}

function getLegPoints(event: JourneyEvent, nextEvent: JourneyEvent): MapPoint[] {
  return [
    [event.longitude, event.latitude],
    ...getWaypointPoints(event).map(
      (waypoint) => [waypoint.longitude, waypoint.latitude] as MapPoint,
    ),
    [nextEvent.longitude, nextEvent.latitude],
  ];
}

function createRouteFeatureCollection(
  legs: { points: MapPoint[]; color: string }[],
): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: legs.map(({ points, color }) => ({
      type: "Feature",
      properties: { color },
      geometry: {
        type: "LineString",
        coordinates: points,
      },
    })),
  };
}

function formatEventDate(timestamp: Date | undefined) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString("de-CH", {
    month: "short",
    year: "numeric",
  });
}

function NutritionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export default function ProductScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const gtin = searchParams.get("gtin");
  const lot = searchParams.get("lot");
  const hasLookupTarget = Boolean(id || gtin);
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [batch, setBatch] = useState<BatchDto | null>(null);
  const [loading, setLoading] = useState(hasLookupTarget);
  const [snap, setSnap] = useState<number | string | null>(SNAP_POINTS[1]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeSegments, setRouteSegments] = useState<Record<string, [number, number][]>>({});
  const [expandedCard, setExpandedCard] = useState(false);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [reportStep, setReportStep] = useState<"closed" | "reason" | "detail">("closed");
  const [reportReason, setReportReason] = useState("");
  const [reportDetail, setReportDetail] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const activeIndexRef = useRef(activeIndex);
  const scrollFrameRef = useRef(0);
  const cardsRef = useRef<Array<HTMLDivElement | null>>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isScrollSnapping = useRef(false);
  const clickedRef = useRef(false);
  const initializedRef = useRef(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center', containScroll: false, dragFree: false }, [WheelGesturesPlugin({ forceWheelAxis: 'x' })]);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const isUserInteractingRef = useRef(false);
  const snapRef = useRef<number | string | null>(SNAP_POINTS[1]);
  const currentSnap = typeof snap === "number" ? snap : SNAP_POINTS[1];
  const drawerProgress =
    (currentSnap - SNAP_POINTS[0]) /
    (SNAP_POINTS[SNAP_POINTS.length - 1] - SNAP_POINTS[0]);
  const clampedDrawerProgress = Math.max(0, Math.min(1, drawerProgress));
  const compactJourney = clampedDrawerProgress > 0.35;
  const isFullyOpen = currentSnap >= SNAP_POINTS[SNAP_POINTS.length - 1];

  // AI features (from API)
  const [shelfLife, setShelfLife] = useState<ShelfLifePredictionDto | null>(null);
  const [anomalyResult, setAnomalyResult] = useState<AnomalyDetectionResultDto | null>(null);
  const [sustainability, setSustainability] = useState<SustainabilityAnalysisDto | null>(null);
  const [alternatives, setAlternatives] = useState<ProductAlternativesDto | null>(null);
  const anomalies = anomalyResult?.anomalies ?? [];

  const coldChainOk = batch ? batch.status === "Ok" || batch.status === 0 : true;

  useEffect(() => {
    if (!batch?.id) return;
    productApi.getShelfLifePrediction({ batchId: batch.id }).then(setShelfLife).catch(() => {});
    productApi.getAnomalyDetection({ batchId: batch.id }).then(setAnomalyResult).catch(() => {});
    productApi.getSustainability({ batchId: batch.id }).then(setSustainability).catch(() => {});
  }, [batch?.id]);

  useEffect(() => {
    if (!product?.id) return;
    productApi.getProductAlternatives({ productId: product.id }).then(setAlternatives).catch(() => {});
  }, [product?.id]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    snapRef.current = snap;
  }, [snap]);

  useEffect(() => {
    if (!hasLookupTarget) return;

    const loadData = async () => {
      try {
        let p: ProductDto | null = null;
        if (id) {
          p = await productApi.getProductById({ id });
        } else if (gtin) {
          p = await productApi.getProductByGtin({ gtin });
        }
        if (!p) { setLoading(false); return; }
        setProduct(p);

        let b: BatchDto | null = null;
        if (lot && gtin) {
          try { b = await productApi.lookupBatch({ gtin, lot }); } catch {
            const firstBatch = p.batches?.[0];
            if (firstBatch?.id) {
              try { b = await productApi.getBatchById({ batchId: firstBatch.id }); } catch {}
            }
          }
        } else {
          const firstBatch = p.batches?.[0];
          if (firstBatch?.id) {
            try { b = await productApi.getBatchById({ batchId: firstBatch.id }); } catch {}
          }
        }

        if (b) {
          setBatch(b);
          if (b.journeyEvents?.length && b.id) {
            try {
              const routeData = await productApi.getBatchRoute({ batchId: b.id });
              if (routeData?.segments) {
                const segMap: Record<string, [number, number][]> = {};
                routeData.segments.forEach((seg, i) => {
                  if (seg.points) {
                    segMap[String(i)] = seg.points.map(p => [p[1], p[0]] as [number, number]);
                  }
                });
                setRouteSegments(segMap);
              }
            } catch {}
          }
        }
      } catch {}
      setLoading(false);
    };

    loadData();
  }, [gtin, hasLookupTarget, id, lot]);

  const events: JourneyEvent[] = (batch?.journeyEvents ?? []) as JourneyEvent[];

  // Preload AI descriptions for all journey events
  useEffect(() => {
    if (events.length === 0) return;
    events.forEach((event) => {
      if (event.id && !descriptions[event.id]) {
        getJourneyEventDescription(event.id)
          .then((desc) => setDescriptions((prev) => ({ ...prev, [event.id]: desc })))
          .catch(() => {});
      }
    });
  }, [events.length, batch?.id]);

  const routeLegs = events.slice(0, -1).map((event, index) => {
    const nextEvent = events[index + 1];
    const realRoute = routeSegments[String(index)];
    return {
      id: `${event.id}-${nextEvent.id}`,
      event,
      nextEvent,
      points: realRoute && realRoute.length > 0 ? realRoute : getLegPoints(event, nextEvent),
      waypoints: getWaypointPoints(event),
      transportType: event.transportType ?? null,
    };
  });
  const allRouteData = createRouteFeatureCollection(
    routeLegs.map((leg) => ({
      points: leg.points,
      color: getMarkerFill(getStatusString(leg.event.status)),
    })),
  );

  const handleMapLoad = useCallback((event: { target: maplibregl.Map }) => {
    mapInstanceRef.current = event.target;
    setMapLoaded(true);
  }, []);

  useEffect(() => {
    if (events.length === 0 || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const activeEvent = events[activeIndex];
    const previousEvent = activeIndex > 0 ? events[activeIndex - 1] : undefined;
    const nextEvent = activeIndex < events.length - 1 ? events[activeIndex + 1] : undefined;
    if (!activeEvent) return;

    // Cancel any in-progress animation so the new target always wins
    map.stop();
    isUserInteractingRef.current = false;

    const targetCamera = getCameraForEvent(activeEvent, previousEvent, nextEvent);

    // Center the marker in the visible gap between top bar and drawer+cards
    // Screen: [top bar ~60px] [visible area] [cards ~80-200px] [drawer]
    // We want the marker at the vertical center of the visible area
    const h = window.innerHeight;
    const topPx = 60; // top bar height
    const drawerFrac = typeof snapRef.current === "number" ? snapRef.current : SNAP_POINTS[1];
    const drawerPx = h * drawerFrac;
    const cardsPx = expandedCard ? 200 : 80;
    const coveredBottom = drawerPx + cardsPx;
    const visibleCenter = topPx + (h - topPx - coveredBottom) / 2;
    // Map center is at h/2. We need to shift by (h/2 - visibleCenter) pixels
    const pixelShift = h / 2 - visibleCenter;

    map.easeTo({
      center: [targetCamera.longitude, targetCamera.latitude],
      zoom: targetCamera.zoom,
      bearing: targetCamera.bearing,
      pitch: targetCamera.pitch,
      duration: 1500,
      padding: { top: 0, bottom: pixelShift * 2, left: 0, right: 0 },
      easing: (t) =>
        t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    });
  }, [activeIndex, events, mapLoaded, snap, expandedCard]);

  const handleInteractionStart = useCallback(() => {
    isUserInteractingRef.current = true;
    mapInstanceRef.current?.stop();
  }, []);

  const handleInteractionEnd = useCallback(() => {
    isUserInteractingRef.current = false;
  }, []);

  const scrollToCard = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const card = cardsRef.current[index];
      const container = scrollRef.current;
      if (!card || !container) return;

      const cardRect = card.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const scrollLeft =
        container.scrollLeft +
        (cardRect.left - containerRect.left) -
        (containerRect.width / 2 - cardRect.width / 2);

      isScrollSnapping.current = true;
      container.scrollTo({ left: scrollLeft, behavior });
      setTimeout(
        () => {
          isScrollSnapping.current = false;
        },
        behavior === "smooth" ? 200 : 30,
      );
    },
    [],
  );

  const getClosestIndex = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return null;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cardsRef.current.forEach((card, index) => {
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }, []);

  const syncActiveIndexFromScroll = useCallback(() => {
    const closestIndex = getClosestIndex();
    if (closestIndex == null) return;

    if (closestIndex !== activeIndexRef.current) {
      activeIndexRef.current = closestIndex;
      setActiveIndex(closestIndex);
    }
  }, [getClosestIndex]);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (scrollFrameRef.current) return;

    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = 0;
      syncActiveIndexFromScroll();
    });
  }, [syncActiveIndexFromScroll]);

  const handleScrollEnd = useCallback(() => {
    if (isScrollSnapping.current) return;

    if (scrollFrameRef.current) {
      cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = 0;
    }

    syncActiveIndexFromScroll();
  }, [syncActiveIndexFromScroll]);

  useEffect(() => {
    if (events.length === 0) return;
    if (!initializedRef.current) {
      initializedRef.current = true;
      scrollToCard(activeIndex, "auto");
      return;
    }
    if (clickedRef.current) {
      clickedRef.current = false;
      scrollToCard(activeIndex, "smooth");
    }
  }, [activeIndex, events.length, scrollToCard]);

  // Embla: sync carousel selection with activeIndex
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      if (idx !== activeIndex) {
        activeIndexRef.current = idx;
        setActiveIndex(idx);
      }
    };
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, activeIndex]);

  // Embla: scroll to active card when activeIndex changes from outside (map click, compact click)
  useEffect(() => {
    if (!emblaApi) return;
    if (emblaApi.selectedScrollSnap() !== activeIndex) {
      emblaApi.scrollTo(activeIndex);
    }
  }, [emblaApi, activeIndex]);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Laden...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <svg className="h-7 w-7 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-semibold">Produkt nicht gefunden</p>
          <p className="text-sm text-muted-foreground mt-1">
            Dieses Produkt ist leider nicht in unserer Datenbank.
          </p>
        </div>
        <div className="flex gap-2 w-full max-w-xs">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
            Startseite
          </Button>
          <Button className="flex-1" onClick={() => navigate("/scan")}>
            Erneut scannen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-background to-background">
        <div className="absolute inset-0 touch-auto" data-vaul-no-drag>
          <Map
            reuseMaps
            attributionControl={false}
            mapStyle={MAP_STYLE_URL}
            initialViewState={DEFAULT_CAMERA}
            onLoad={handleMapLoad}
            onClick={() => { if (expandedCard) setExpandedCard(false); }}
            onDragStart={handleInteractionStart}
            onDragEnd={handleInteractionEnd}
            onZoomStart={handleInteractionStart}
            onZoomEnd={handleInteractionEnd}
            style={{ width: "100%", height: "100%" }}
          >
            <Source id="journey-routes" type="geojson" data={allRouteData}>
              <Layer
                id="journey-routes-line"
                type="line"
                layout={{ "line-cap": "round", "line-join": "round" }}
                paint={{
                  "line-color": ["get", "color"],
                  "line-width": 4,
                  "line-opacity": 0.9,
                }}
              />
            </Source>

            {routeLegs.map((leg) =>
              leg.waypoints.map((waypoint, waypointIndex) => {
                const transportIcon = getTransportIcon(
                  waypoint.transportType ?? leg.transportType,
                  leg.event,
                );

                return (
                  <Marker
                    key={waypoint.id ?? `${leg.id}-waypoint-${waypointIndex}`}
                    longitude={waypoint.longitude}
                    latitude={waypoint.latitude}
                    anchor="center"
                  >
                    <div className="pointer-events-none relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-full">
                      <div
                        className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-white shadow-sm"
                        style={{
                          borderColor: getMarkerFill(getStatusString(leg.event.status)),
                          boxShadow: "0 0 0 1.5px rgba(255,255,255,0.96)",
                        }}
                      >
                          <HugeiconsIcon
                            icon={transportIcon}
                            strokeWidth={2}
                            className="size-2.5 text-foreground"
                          />
                      </div>
                    </div>
                  </Marker>
                );
              }),
            )}

            {events.map((event, index) => (
              <Marker
                key={event.id}
                longitude={event.longitude}
                latitude={event.latitude}
                anchor="center"
              >
                <div className="pointer-events-none relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full">
                  {index === activeIndex && (
                    <div
                      className="map-node-pulse absolute inset-0 rounded-full"
                      style={{ backgroundColor: getMarkerFill(getStatusString(event.status)) }}
                    />
                  )}
                  <div
                    className="relative flex items-center justify-center rounded-full border-2 text-white shadow-md"
                    style={{
                      width: index === activeIndex ? 24 : 20,
                      height: index === activeIndex ? 24 : 20,
                      backgroundColor: getMarkerFill(getStatusString(event.status)),
                      borderColor: "#ffffff",
                      boxShadow: "0 0 0 2px rgba(255,255,255,0.98)",
                    }}
                  >
                      <HugeiconsIcon
                        icon={getEventIcon(event)}
                        strokeWidth={2}
                        className={index === activeIndex ? "size-3.5 text-white" : "size-3 text-white"}
                      />
                  </div>
                </div>
              </Marker>
            ))}
          </Map>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/95 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background to-transparent" />

        <div className="pointer-events-auto absolute left-0 right-0 top-0 z-[51] flex items-center justify-between px-4 pt-12">
          <Button
            variant="outline"
            size="icon"
            className="bg-background/95 shadow-sm"
            onClick={() => navigate("/")}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path
                d="M19 12H5M12 5l-7 7 7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>

          <div className="rounded-full bg-background/90 border shadow-sm px-3 py-1.5">
            <span className="text-xs font-semibold truncate">{product.name}</span>
          </div>
        </div>
      </div>

      <Drawer
        open
        modal={false}
        snapPoints={SNAP_POINTS}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
      >
        <DrawerContent showOverlay={false} className="data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[100dvh] min-h-[100dvh] flex flex-col bg-popover rounded-t-3xl border-t border-x border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] before:hidden">
          {events.length > 0 && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-full pb-2 transition-all duration-300"
              style={{ opacity: isFullyOpen ? 0 : 1, transform: isFullyOpen ? 'scale(0.95) translateY(8px)' : 'scale(1) translateY(0)' }}
            >
              <div
                className="pointer-events-auto overflow-hidden"
                ref={emblaRef}
                onPointerDownCapture={(event) => event.stopPropagation()}
              >
                <div className="flex items-stretch gap-3 px-4">
                  {events.map((event, index) => (
                    <div
                      key={event.id}
                      ref={(element) => { cardsRef.current[index] = element; }}
                      onClick={() => {
                        if (compactJourney) {
                          clickedRef.current = true;
                          setActiveIndex(index);
                          return;
                        }
                        if (index !== activeIndex) {
                          clickedRef.current = true;
                          setActiveIndex(index);
                          return;
                        }
                        setExpandedCard(!expandedCard);
                      }}
                      className="shrink-0 cursor-pointer"
                      style={{
                        flex: compactJourney
                          ? '0 0 auto'
                          : expandedCard
                            ? '0 0 85vw'
                            : '0 0 280px',
                        transition: 'flex-basis 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <Card
                        size="sm"
                        className={`bg-background/96 text-left shadow-sm transition-all duration-300 h-full ${
                          index === activeIndex
                            ? "border-primary ring-2 ring-primary/15"
                            : "border-border"
                        }`}
                      >
                        <CardContent
                          className="transition-all duration-400 overflow-hidden"
                          style={{
                            padding: compactJourney ? "4px 10px" : expandedCard ? "16px" : "16px",
                            maxHeight: compactJourney ? "32px" : expandedCard ? "600px" : "100px",
                            transition: "max-height 400ms cubic-bezier(0.4, 0, 0.2, 1), padding 300ms ease",
                          }}
                        >
                          {compactJourney ? (
                            <div className="flex items-center gap-2">
                              <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${journeyStatusDot[getStatusString(event.status)] ?? "bg-primary"}`}>
                                <HugeiconsIcon icon={getEventIcon(event)} strokeWidth={2.5} className="size-2.5" />
                              </div>
                              <span className="text-xs font-medium">
                                {event.step}
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {/* Header */}
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${journeyStatusDot[getStatusString(event.status)] ?? "bg-primary"}`}
                                >
                                  <HugeiconsIcon icon={getEventIcon(event)} strokeWidth={2} className="size-3.5" />
                                </div>
                                <p className="text-sm font-semibold leading-tight">
                                  {event.step}
                                </p>
                              </div>

                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{event.location}</span>
                                <span>{formatEventDate(event.timestamp)}</span>
                              </div>

                              {/* Expanded detail content */}
                              {expandedCard && (() => {
                                const prevEv = index > 0 ? events[index - 1] : null;
                                const hrs = prevEv
                                  ? Math.round((new Date(event.timestamp).getTime() - new Date(prevEv.timestamp).getTime()) / 3600000)
                                  : null;
                                const desc = descriptions[event.id];

                                return (
                                  <div className="space-y-3 pt-2 border-t border-border/50">
                                    {/* Stats grid */}
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Datum</p>
                                        <p className="text-xs font-semibold mt-0.5">{new Date(event.timestamp).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}</p>
                                      </div>
                                      {event.temperature != null && (
                                        <div className="rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-2">
                                          <p className="text-[9px] text-blue-600 uppercase tracking-wider">Temperatur</p>
                                          <p className="text-xs font-semibold text-blue-700 mt-0.5">{event.temperature}°C</p>
                                        </div>
                                      )}
                                      {hrs != null && hrs > 0 && (
                                        <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Transportdauer</p>
                                          <p className="text-xs font-semibold mt-0.5">{hrs < 24 ? `${hrs} Stunden` : `${Math.round(hrs / 24)} Tage`}</p>
                                        </div>
                                      )}
                                      {event.co2Kg != null && (
                                        <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-2">
                                          <p className="text-[9px] text-emerald-600 uppercase tracking-wider">CO₂-Ausstoss</p>
                                          <p className="text-xs font-semibold text-emerald-700 mt-0.5">{event.co2Kg} kg</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* AI insight */}
                                    <div>
                                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Einblick</p>
                                      {desc ? (
                                        <p className="text-[12px] leading-[1.6] text-foreground/85">{desc}</p>
                                      ) : (
                                        <div className="space-y-2">
                                          <div className="h-3 w-full rounded bg-muted animate-pulse" />
                                          <div className="h-3 w-[90%] rounded bg-muted animate-pulse" />
                                          <div className="h-3 w-4/5 rounded bg-muted animate-pulse" />
                                          <div className="h-3 w-3/5 rounded bg-muted animate-pulse" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Location detail */}
                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                                      <span>{event.location}</span>
                                      <span className="font-mono">{event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DrawerHeader className="shrink-0 pb-2">
            <DrawerTitle className="text-sm font-semibold text-muted-foreground">
              {product.brand}{product.weight ? ` · ${product.weight}` : ''}
            </DrawerTitle>
            {batch?.lotNumber && (
              <p className="text-[10px] font-mono text-muted-foreground">LOT {batch.lotNumber}</p>
            )}
            <DrawerDescription className="sr-only">Product details</DrawerDescription>
            {!coldChainOk && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 mt-1">
                <Thermometer className="h-3.5 w-3.5 shrink-0" />
                <p className="text-[10px]">Kühlketten-Abweichung erkannt.</p>
              </div>
            )}
          </DrawerHeader>

          <div
            className="flex-1 overflow-y-auto overscroll-y-contain pb-[max(6rem,env(safe-area-inset-bottom))]"
          >
            <div className="px-4 space-y-4">
              {/* Origin */}
              {product.origin && (
                <div className="rounded-xl border px-3 py-2 flex items-center gap-3">
                  <p className="text-[10px] text-muted-foreground shrink-0">Herkunft</p>
                  <div className="flex items-center justify-between flex-1 text-xs font-semibold">
                    {product.origin.split("→").map((step, i, arr) => (
                      <span key={i} className="contents">
                        {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                        <span>{step.trim()}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Badges */}
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
                  <div className="rounded-xl border px-3 py-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground leading-tight">CO₂</p>
                    <p className="text-xs font-semibold leading-tight mt-0.5">{sustainability.totalCo2Kg} kg</p>
                  </div>
                )}
                {(batch?.temperatureLogs ?? []).length > 0 && (
                  <div className={`rounded-xl border px-3 py-1.5 text-center ${coldChainOk ? "border-emerald-200" : "border-amber-200"}`}>
                    <p className="text-[10px] text-muted-foreground leading-tight">Kühlkette</p>
                    <p className="text-xs font-semibold leading-tight mt-0.5">{coldChainOk ? "Intakt" : "Abweichung"}</p>
                  </div>
                )}
              </div>

              {/* Certifications */}
              {(product.certifications ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(product.certifications ?? []).map((c) => (
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
                    <NutritionRow label="Energie" value={`${product.nutrition.energyKcal ?? 0} kcal`} />
                    <NutritionRow label="Fett" value={`${product.nutrition.fat ?? 0} g`} />
                    <NutritionRow label="Ges. Fettsäuren" value={`${product.nutrition.saturatedFat ?? 0} g`} />
                    <NutritionRow label="Kohlenhydrate" value={`${product.nutrition.sugars ?? 0} g`} />
                    <NutritionRow label="Eiweiß" value={`${product.nutrition.protein ?? 0} g`} />
                    <NutritionRow label="Salz" value={`${product.nutrition.salt ?? 0} g`} />
                    <NutritionRow label="Ballaststoffe" value={`${product.nutrition.fiber ?? 0} g`} />
                  </div>
                </section>
              )}

              {/* Shelf life */}
              {shelfLife && <ShelfLifeCard prediction={shelfLife} />}

              {/* Anomaly detection */}
              {anomalyResult && <AnomalyCard result={anomalyResult} />}

              {/* Ecological footprint */}
              {sustainability && <SustainabilityDetailCard analysis={sustainability} />}

              {/* Blockchain verification */}
              {batch?.id && <BlockchainCard batchId={batch.id} />}

              {/* Alternatives */}
              {alternatives && <AlternativesCard data={alternatives} />}

              {/* Report issue */}
              {reportSent ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5">
                  <p className="text-xs font-semibold text-emerald-800">Meldung gesendet — Danke!</p>
                </div>
              ) : (
                <button
                  onClick={() => setReportStep("reason")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 mb-6 text-xs font-semibold text-red-700 active:bg-red-100"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Problem melden
                </button>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Report sheets — portaled to body to escape drawer event capture */}
      {reportStep === "reason" && createPortal(
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReportStep("closed")} />
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
                  onClick={() => { setReportReason(r); setReportStep("detail"); }}
                  className="flex w-full items-center rounded-xl border px-3 py-2.5 text-sm active:bg-muted transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
            <button onClick={() => setReportStep("closed")} className="w-full py-2 text-sm text-muted-foreground">
              Abbrechen
            </button>
          </div>
        </div>,
        document.body
      )}

      {reportStep === "detail" && createPortal(
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReportStep("closed")} />
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl bg-background p-5 space-y-4">
            <div className="mx-auto h-1 w-10 rounded-full bg-muted" />
            <div className="text-center">
              <p className="text-base font-semibold">{reportReason}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Beschreibe das Problem{reportReason !== "Sonstiges" ? " (optional)" : ""}</p>
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
              onClick={() => {
                productApi.createReport({
                  productId: product.id!,
                  batchId: batch?.id,
                  createReportDto: { reason: reportReason, details: reportDetail || undefined },
                }).catch(() => {});
                setReportSent(true);
                setReportStep("closed");
              }}
              disabled={reportReason === "Sonstiges" && !reportDetail.trim()}
              className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white disabled:opacity-30"
            >
              Absenden
            </button>
            <button onClick={() => setReportStep("reason")} className="w-full py-2 text-sm text-muted-foreground">
              Zurück
            </button>
          </div>
        </div>,
        document.body
      )}

      {product?.id && <ProductChat productId={product.id} batchId={batch?.id} />}
    </div>
  );
}
