import { useCallback, useEffect, useRef, useState } from "react";
import type { FeatureCollection, LineString } from "geojson";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  CargoShipIcon,
  DeliveryTruck02Icon,
  Factory02Icon,
  Leaf02Icon,
  Location02Icon,
  MilkCartonIcon,
  Navigation03Icon,
  StoreLocation02Icon,
  WarehouseIcon,
} from "@hugeicons/core-free-icons";
import maplibregl from "maplibre-gl";
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
import { productApi } from "@/api/client";
import type { ProductDto } from "@/api/models/ProductDto";
import type { BatchDto } from "@/api/models/BatchDto";
import type { JourneyEventDto } from "@/api/models/JourneyEventDto";
import { getShelfLifePrediction, getAnomalyDetection, getSustainabilityAnalysis, getProductAlternatives } from "@/data/mock-ai";
import { ShelfLifeCard } from "@/components/product/ShelfLifeCard";
import { AlternativesCard } from "@/components/product/AlternativesCard";

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

function getStatusString(status: number | undefined): string {
  if (status === 2) return "Warning";
  if (status === 1) return "Current";
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

  if (getStatusString(event.status) === "Warning") return AlertCircleIcon;
  if (signature.includes("sprout") || signature.includes("ernte") || signature.includes("farm")) {
    return Leaf02Icon;
  }
  if (signature.includes("factory") || signature.includes("verarbeitung")) {
    return Factory02Icon;
  }
  if (signature.includes("transport") || signature.includes("truck")) {
    return DeliveryTruck02Icon;
  }
  if (signature.includes("lager") || signature.includes("warehouse")) {
    return WarehouseIcon;
  }
  if (signature.includes("regal") || signature.includes("store")) {
    return StoreLocation02Icon;
  }
  if (signature.includes("milk")) {
    return MilkCartonIcon;
  }

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

  // AI features (mock data)
  const productId = product?.id ?? "";
  const shelfLife = getShelfLifePrediction(productId);
  const anomalyResult = getAnomalyDetection(productId);
  const sustainability = getSustainabilityAnalysis(productId);
  const alternatives = getProductAlternatives(productId);
  const anomalies = anomalyResult?.anomalies ?? [];

  const coldChainOk = batch ? batch.status === 0 : true;

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

    const drawerFraction = typeof snapRef.current === "number" ? snapRef.current : SNAP_POINTS[1];
    const visibleCenterFraction = (1 - drawerFraction) / 2;
    const offsetFraction = 0.5 - visibleCenterFraction;
    const degreesPerPixel = 360 / (512 * Math.pow(2, targetCamera.zoom));
    const pitchFactor = 1 / Math.cos((48 * Math.PI) / 180);
    targetCamera.latitude -= offsetFraction * 700 * degreesPerPixel * pitchFactor;

    map.easeTo({
      center: [targetCamera.longitude, targetCamera.latitude],
      zoom: targetCamera.zoom,
      bearing: targetCamera.bearing,
      pitch: targetCamera.pitch,
      duration: 1500,
      easing: (t) =>
        t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    });
  }, [activeIndex, events, mapLoaded]);

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
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Produkt nicht gefunden.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Zurück
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-background to-background">
        <div className="absolute inset-0" data-vaul-no-drag>
          <Map
            reuseMaps
            attributionControl={false}
            mapStyle={MAP_STYLE_URL}
            initialViewState={DEFAULT_CAMERA}
            onLoad={handleMapLoad}
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

        <div className="pointer-events-auto absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 pt-12">
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
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[100dvh] min-h-[100dvh] flex flex-col bg-popover rounded-t-3xl border-t border-x border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] before:hidden">
          {events.length > 0 && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-full pb-2 transition-all duration-300"
              style={{ opacity: isFullyOpen ? 0 : 1, transform: isFullyOpen ? 'scale(0.95) translateY(8px)' : 'scale(1) translateY(0)' }}
            >
              <div
                ref={scrollRef}
                onScroll={compactJourney ? undefined : handleScroll}
                onScrollEnd={compactJourney ? undefined : handleScrollEnd}
                onPointerDownCapture={(event) => event.stopPropagation()}
                className={`pointer-events-auto flex items-center gap-0 overscroll-x-contain px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                  compactJourney
                    ? "overflow-x-hidden"
                    : "snap-x snap-mandatory overflow-x-auto touch-pan-x"
                }`}
              >
                <div className="w-[40%] shrink-0" />
                {events.map((event, index) => (
                  <div key={event.id} className="flex shrink-0 items-center">
                    {index > 0 && (
                      <div className="flex items-center px-1">
                        <svg
                          className="h-3 w-8 transition-colors duration-300"
                          viewBox="0 0 32 12"
                          fill="none"
                        >
                          <line
                            x1="0"
                            y1="6"
                            x2="24"
                            y2="6"
                            stroke={journeyStatusColor[getStatusString(events[index - 1].status)] ?? "#3d6b2e"}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <polyline
                            points="22,2 28,6 22,10"
                            stroke={journeyStatusColor[getStatusString(events[index - 1].status)] ?? "#3d6b2e"}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </svg>
                      </div>
                    )}

                    <div
                      ref={(element) => {
                        cardsRef.current[index] = element;
                      }}
                      onClick={() => {
                        if (compactJourney) {
                          clickedRef.current = true;
                          setActiveIndex(index);
                        }
                      }}
                      className={`shrink-0 ${compactJourney ? "cursor-pointer" : "snap-center"}`}
                    >
                      <Card
                        size="sm"
                        className={`bg-background/96 text-left shadow-sm transition-all duration-200 ${
                          index === activeIndex
                            ? "border-primary ring-2 ring-primary/15"
                            : "border-border"
                        }`}
                        style={{ width: compactJourney ? "90px" : "280px", transition: "width 300ms ease, padding 300ms ease" }}
                      >
                        <CardContent
                          className="transition-all duration-300 overflow-hidden"
                          style={{
                            padding: compactJourney ? "4px 10px" : "16px",
                            maxHeight: compactJourney ? "32px" : "200px",
                          }}
                        >
                          {compactJourney ? (
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${journeyStatusDot[getStatusString(event.status)] ?? "bg-primary"}`}
                              />
                              <span className="text-xs font-medium">
                                {event.step}
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${journeyStatusDot[getStatusString(event.status)] ?? "bg-primary"}`}
                                >
                                  {index + 1}
                                </div>
                                <p className="text-sm font-semibold leading-tight">
                                  {event.step}
                                </p>
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
                    </div>
                  </div>
                ))}

                <div className="w-[40%] shrink-0" />
              </div>
            </div>
          )}

          <DrawerHeader className="shrink-0 pb-2">
            <DrawerTitle className="text-sm font-semibold text-muted-foreground">
              {product.brand}{product.weight ? ` · ${product.weight}` : ''}
            </DrawerTitle>
            <DrawerDescription className="sr-only">Product details</DrawerDescription>
            {!coldChainOk && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 mt-1">
                <Thermometer className="h-3.5 w-3.5 shrink-0" />
                <p className="text-[10px]">Kühlketten-Abweichung erkannt.</p>
              </div>
            )}
          </DrawerHeader>

          <div
            className={`flex-1 overscroll-y-contain pb-[max(1.5rem,env(safe-area-inset-bottom))] ${
              isFullyOpen ? "overflow-y-auto" : "overflow-hidden"
            }`}
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

              {/* Anomalies */}
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

              {/* Ecological footprint */}
              {sustainability && (
                <section>
                  <p className="text-sm font-semibold mb-2">Ökologischer Fußabdruck</p>
                  <div className="space-y-1.5 text-[13px]">
                    <NutritionRow label="CO₂ pro 100 g" value={`${sustainability.totalCo2Kg} kg`} />
                    <NutritionRow label="Wasserverbrauch" value={`${sustainability.waterFootprintL} L`} />
                    <NutritionRow label="Transportweg" value={`${sustainability.transportDistanceKm.toLocaleString()} km`} />
                  </div>
                  <p className={`text-xs mt-1.5 ${sustainability.comparisonToAverage < 0 ? "text-emerald-600" : "text-amber-600"}`}>
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
                  onClick={() => setReportStep("reason")}
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
      {reportStep === "reason" && (
        <div className="fixed inset-0 z-[60]">
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
        </div>
      )}

      {/* Report sheet — step 2: add details */}
      {reportStep === "detail" && (
        <div className="fixed inset-0 z-[60]">
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
              onClick={() => { setReportSent(true); setReportStep("closed"); }}
              disabled={reportReason === "Sonstiges" && !reportDetail.trim()}
              className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white disabled:opacity-30"
            >
              Absenden
            </button>
            <button onClick={() => setReportStep("reason")} className="w-full py-2 text-sm text-muted-foreground">
              Zurück
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
