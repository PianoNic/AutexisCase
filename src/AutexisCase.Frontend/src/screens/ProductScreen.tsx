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
import { useAppAuth } from "@/auth/use-app-auth";

const MAP_STYLE_URL =
  "https://maps.black/styles/openstreetmap-protomaps/protomaps/grayscale/style.json";
// terrain/contour removed
const SNAP_POINTS = [0.08, 0.55, 0.995];
const EMPTY_EVENTS: JourneyEvent[] = [];
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

interface JourneyEvent {
  id: string;
  step: string;
  location: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  status: string;
  icon: string | null;
  temperature: number | null;
  details: string | null;
  co2Kg: number | null;
  waterLiters: number | null;
  cost: number | null;
  transportType?: string | null;
  waypoints?: JourneyWaypoint[] | null;
}

interface Nutrition {
  energyKcal: number;
  fat: number;
  saturatedFat: number;
  carbs: number;
  sugars: number;
  fiber: number;
  protein: number;
  salt: number;
}

interface BatchSummary {
  id: string;
  lotNumber: string;
  status: string;
  riskScore: number;
  expiryDate: string | null;
}

interface Batch {
  id: string;
  productId: string;
  lotNumber: string;
  status: string;
  riskScore: number;
  shelfLifeDays: number | null;
  daysRemaining: number | null;
  co2Kg: number | null;
  waterLiters: number | null;
  productionDate: string | null;
  expiryDate: string | null;
  journeyEvents: JourneyEvent[];
  alerts: unknown[];
}

interface Product {
  id: string;
  gtin: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  category: string | null;
  weight: string | null;
  origin: string | null;
  certifications: string[];
  nutriScore: string | null;
  novaGroup: number | null;
  ecoScore: string | null;
  nutrition: Nutrition;
  batches: BatchSummary[];
}

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

const batchStatusLabel: Record<string, string> = {
  Ok: "OK",
  Warning: "Warning",
  Recall: "Recall",
};

const batchBadgeVariant: Record<string, "default" | "secondary" | "destructive"> = {
  Ok: "default",
  Warning: "secondary",
  Recall: "destructive",
};

function interpolate(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
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
  const signature = `${event.icon ?? ""} ${event.step} ${event.location}`.toLowerCase();

  if (event.status === "Warning") return AlertCircleIcon;
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
    `${transportType ?? ""} ${fallbackEvent.icon ?? ""} ${fallbackEvent.step}`.toLowerCase();

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

function getPointAlongPath(points: MapPoint[], progress: number): MapPoint {
  if (points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];

  const lengths = points.slice(0, -1).map((point, index) => {
    const nextPoint = points[index + 1];
    return Math.hypot(nextPoint[0] - point[0], nextPoint[1] - point[1]);
  });

  const totalLength = lengths.reduce((sum, length) => sum + length, 0);
  if (totalLength === 0) return points[0];

  let traveled = totalLength * progress;

  for (let index = 0; index < lengths.length; index += 1) {
    const segmentLength = lengths[index];
    if (traveled <= segmentLength) {
      const start = points[index];
      const end = points[index + 1];
      const segmentProgress = segmentLength === 0 ? 0 : traveled / segmentLength;
      return [
        interpolate(start[0], end[0], segmentProgress),
        interpolate(start[1], end[1], segmentProgress),
      ];
    }
    traveled -= segmentLength;
  }

  return points.at(-1) ?? points[0];
}

function getPathUntilProgress(points: MapPoint[], progress: number): MapPoint[] {
  if (points.length <= 1) return points;

  const clamped = Math.max(0, Math.min(1, progress));
  if (clamped === 0) return [points[0]];
  if (clamped === 1) return points;

  const lengths = points.slice(0, -1).map((point, index) => {
    const nextPoint = points[index + 1];
    return Math.hypot(nextPoint[0] - point[0], nextPoint[1] - point[1]);
  });

  const totalLength = lengths.reduce((sum, length) => sum + length, 0);
  if (totalLength === 0) return points;

  let traveled = totalLength * clamped;
  const partialPoints: MapPoint[] = [points[0]];

  for (let index = 0; index < lengths.length; index += 1) {
    const segmentLength = lengths[index];
    const start = points[index];
    const end = points[index + 1];

    if (traveled >= segmentLength) {
      partialPoints.push(end);
      traveled -= segmentLength;
      continue;
    }

    const segmentProgress = segmentLength === 0 ? 0 : traveled / segmentLength;
    partialPoints.push([
      interpolate(start[0], end[0], segmentProgress),
      interpolate(start[1], end[1], segmentProgress),
    ]);
    break;
  }

  return partialPoints;
}

function createRouteFeatureCollection(pointsCollection: MapPoint[][]): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: pointsCollection.map((points) => ({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: points,
      },
    })),
  };
}

function formatEventDate(timestamp: string) {
  return new Date(timestamp).toLocaleDateString("de-CH", {
    month: "short",
    year: "numeric",
  });
}

export default function ProductScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accessToken } = useAppAuth();
  const id = searchParams.get("id");
  const gtin = searchParams.get("gtin");
  const lot = searchParams.get("lot");
  const hasLookupTarget = Boolean(id || gtin);
  const [product, setProduct] = useState<Product | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(hasLookupTarget);
  const [snap, setSnap] = useState<number | string | null>(SNAP_POINTS[1]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [routeProgress, setRouteProgress] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeSegments, setRouteSegments] = useState<Record<string, [number, number][]>>({});
  const activeIndexRef = useRef(activeIndex);
  const animFrameRef = useRef(0);
  const scrollFrameRef = useRef(0);
  const routeAnimFrameRef = useRef(0);
  const cardsRef = useRef<Array<HTMLDivElement | null>>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isScrollSnapping = useRef(false);
  const clickedRef = useRef(false);
  const initializedRef = useRef(false);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const isUserInteractingRef = useRef(false);
  const dashAnimFrameRef = useRef(0);
  const snapRef = useRef<number | string | null>(SNAP_POINTS[1]);
  const currentSnap = typeof snap === "number" ? snap : SNAP_POINTS[1];
  const drawerProgress =
    (currentSnap - SNAP_POINTS[0]) /
    (SNAP_POINTS[SNAP_POINTS.length - 1] - SNAP_POINTS[0]);
  const clampedDrawerProgress = Math.max(0, Math.min(1, drawerProgress));
  const compactJourney = clampedDrawerProgress > 0.35;
  const isFullyOpen = currentSnap >= SNAP_POINTS[SNAP_POINTS.length - 1];

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    snapRef.current = snap;
  }, [snap]);

  useEffect(() => {
    if (!accessToken || !hasLookupTarget) return;

    const url = id ? `/api/Product/${id}` : `/api/Product/gtin/${gtin}`;
    fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Product | null) => {
        setProduct(data);
        // If LOT provided, look up specific batch; otherwise use first batch
        const batchUrl = lot && gtin
          ? `/api/Product/batch/lookup?gtin=${gtin}&lot=${encodeURIComponent(lot)}`
          : data?.batches?.length
            ? `/api/Product/batch/${data.batches[0].id}`
            : null;

        if (batchUrl) {
          fetch(batchUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((batchData: Batch | null) => {
              setBatch(batchData);
              if (batchData?.journeyEvents?.length) {
                // Fetch real route polylines
                if (batchData.id) {
                  fetch(`/api/Product/batch/${batchData.id}/route`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                  })
                    .then((r) => (r.ok ? r.json() : null))
                    .then((routeData: { segments: { fromStep: string; toStep: string; points: number[][] }[] } | null) => {
                      if (routeData?.segments) {
                        const segMap: Record<string, [number, number][]> = {};
                        routeData.segments.forEach((seg, i) => {
                          segMap[String(i)] = seg.points.map(p => [p[1], p[0]] as [number, number]); // [lon, lat] for maplibre
                        });
                        setRouteSegments(segMap);
                      }
                    })
                    .catch(console.error);
                }
              }
            })
            .catch(console.error);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken, gtin, hasLookupTarget, id]);

  const events = batch?.journeyEvents ?? EMPTY_EVENTS;
  const routeLegs = events.slice(0, -1).map((event, index) => {
    const nextEvent = events[index + 1];
    // Use real ORS route polyline if available, otherwise fall back to straight line
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
  const activeLegIndex = routeLegs.length > 0 ? Math.min(activeIndex, routeLegs.length - 1) : -1;
  const activeLeg = activeLegIndex >= 0 ? routeLegs[activeLegIndex] : null;
  const activeTransportPoint =
    activeLeg && activeLeg.points.length > 1
      ? getPointAlongPath(activeLeg.points, routeProgress)
      : null;
  const activeRouteTrailData = createRouteFeatureCollection(
    activeLeg ? [getPathUntilProgress(activeLeg.points, routeProgress)] : [],
  );
  const completedRouteData = createRouteFeatureCollection(
    routeLegs
      .filter((_, legIndex) => legIndex < activeLegIndex)
      .map((leg) => leg.points),
  );
  const activeRouteData = createRouteFeatureCollection(
    activeLeg ? [activeLeg.points] : [],
  );
  const upcomingRouteData = createRouteFeatureCollection(
    routeLegs
      .filter((_, legIndex) => legIndex > activeLegIndex)
      .map((leg) => leg.points),
  );

  const handleMapLoad = useCallback((event: { target: maplibregl.Map }) => {
    const map = event.target;
    mapInstanceRef.current = map;
    setMapLoaded(true);

    // Flowing dash animation for upcoming + active-bg paths
    const dashSequence = [
      [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5],
      [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
      [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5],
      [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1],
      [0, 3.5, 3, 0.5], [0, 4, 3, 0],
    ];
    let step = 0;
    let lastFrameTime = 0;
    const stepInterval = 60; // ms per step

    const animateDashes = (time: number) => {
      if (time - lastFrameTime >= stepInterval) {
        step = (step + 1) % dashSequence.length;
        const dash = dashSequence[step];
        try {
          if (map.getLayer("journey-upcoming-line")) {
            map.setPaintProperty("journey-upcoming-line", "line-dasharray", dash);
          }
          if (map.getLayer("journey-active-line")) {
            map.setPaintProperty("journey-active-line", "line-dasharray", dash);
          }
        } catch {
          // layers may not exist yet
        }
        lastFrameTime = time;
      }
      dashAnimFrameRef.current = requestAnimationFrame(animateDashes);
    };
    dashAnimFrameRef.current = requestAnimationFrame(animateDashes);
  }, []);

  useEffect(() => {
    if (events.length === 0 || !mapInstanceRef.current) return;
    if (isUserInteractingRef.current) return;

    const map = mapInstanceRef.current;
    const activeEvent = events[activeIndex];
    const previousEvent = activeIndex > 0 ? events[activeIndex - 1] : undefined;
    const nextEvent = activeIndex < events.length - 1 ? events[activeIndex + 1] : undefined;
    if (!activeEvent) return;

    const targetCamera = getCameraForEvent(activeEvent, previousEvent, nextEvent);

    // Shift camera south so the event marker renders in the visible area above the drawer.
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

  useEffect(() => {
    if (!activeLeg) return;

    cancelAnimationFrame(routeAnimFrameRef.current);
    setRouteProgress(0);
    const travelDuration = 18000;
    const startedAt = performance.now();

    const animateRoute = (time: number) => {
      const elapsed = Math.min(time - startedAt, travelDuration);
      const rawProgress = elapsed / travelDuration;
      const progress =
        rawProgress < 0.5
          ? 4 * rawProgress * rawProgress * rawProgress
          : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;
      setRouteProgress(progress);

      if (elapsed < travelDuration) {
        routeAnimFrameRef.current = requestAnimationFrame(animateRoute);
      }
    };

    routeAnimFrameRef.current = requestAnimationFrame(animateRoute);
    return () => cancelAnimationFrame(routeAnimFrameRef.current);
  }, [activeLeg]);

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
      if (routeAnimFrameRef.current) {
        cancelAnimationFrame(routeAnimFrameRef.current);
      }
      if (dashAnimFrameRef.current) {
        cancelAnimationFrame(dashAnimFrameRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Product not found.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Go back
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
            <Source id="journey-completed" type="geojson" data={completedRouteData}>
              <Layer
                id="journey-completed-line"
                type="line"
                layout={{ "line-cap": "round", "line-join": "round" }}
                paint={{
                  "line-color": "#22c55e",
                  "line-width": 4,
                  "line-opacity": 0.9,
                }}
              />
            </Source>
            <Source id="journey-upcoming" type="geojson" data={upcomingRouteData}>
              <Layer
                id="journey-upcoming-line"
                type="line"
                layout={{ "line-cap": "round", "line-join": "round" }}
                paint={{
                  "line-color": "#60a5fa",
                  "line-width": 3.5,
                  "line-opacity": 0.85,
                }}
              />
            </Source>
            <Source id="journey-active" type="geojson" data={activeRouteData}>
              <Layer
                id="journey-active-line"
                type="line"
                layout={{ "line-cap": "round", "line-join": "round" }}
                paint={{
                  "line-color": "#f59e0b",
                  "line-width": 3.5,
                  "line-opacity": 0.45,
                }}
              />
            </Source>
            <Source id="journey-active-trail" type="geojson" data={activeRouteTrailData}>
              <Layer
                id="journey-active-trail-line"
                type="line"
                layout={{ "line-cap": "round", "line-join": "round" }}
                paint={{
                  "line-color": activeLeg ? getMarkerFill(activeLeg.event.status) : "#42695c",
                  "line-width": 5,
                  "line-opacity": 0.96,
                }}
              />
            </Source>

            {routeLegs.map((leg, legIndex) =>
              leg.waypoints.map((waypoint, waypointIndex) => {
                const isActive = legIndex === activeLegIndex;
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
                      {isActive && (
                        <div
                          className="map-waypoint-pulse absolute inset-0 rounded-full"
                          style={{ backgroundColor: getMarkerFill(leg.event.status) }}
                        />
                      )}
                      <div
                        className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-white shadow-sm"
                        style={{
                          borderColor: getMarkerFill(leg.event.status),
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

            {activeTransportPoint && activeLeg && (
              <Marker
                longitude={activeTransportPoint[0]}
                latitude={activeTransportPoint[1]}
                anchor="center"
              >
                <div className="pointer-events-none relative flex h-7 w-7 items-center justify-center">
                  <div
                    className="relative flex h-5.5 w-5.5 items-center justify-center rounded-full border-2 bg-white shadow-md"
                    style={{
                      borderColor: getMarkerFill(activeLeg.event.status),
                      boxShadow:
                        "0 0 0 2px rgba(255,255,255,0.98), 0 6px 16px rgba(15,23,42,0.18)",
                    }}
                  >
                      <HugeiconsIcon
                        icon={getTransportIcon(activeLeg.transportType, activeLeg.event)}
                        strokeWidth={2}
                        className="size-3.5 text-foreground"
                      />
                  </div>
                </div>
              </Marker>
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
                      style={{ backgroundColor: getMarkerFill(event.status) }}
                    />
                  )}
                  <div
                    className="relative flex items-center justify-center rounded-full border-2 text-white shadow-md"
                    style={{
                      width: index === activeIndex ? 24 : 20,
                      height: index === activeIndex ? 24 : 20,
                      backgroundColor: getMarkerFill(event.status),
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
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[100dvh] min-h-[100dvh] flex flex-col bg-popover before:hidden">
          {events.length > 0 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-full pb-2">
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
                            stroke={journeyStatusColor[events[index - 1].status] ?? "#3d6b2e"}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <polyline
                            points="22,2 28,6 22,10"
                            stroke={journeyStatusColor[events[index - 1].status] ?? "#3d6b2e"}
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
                        style={{ width: compactJourney ? undefined : "280px" }}
                      >
                        <CardContent
                          className={
                            compactJourney
                              ? "px-2.5 py-1"
                              : "space-y-3 px-4 py-4"
                          }
                        >
                          {compactJourney ? (
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${journeyStatusDot[event.status] ?? "bg-primary"}`}
                              />
                              <span className="text-xs font-medium">
                                {event.step}
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${journeyStatusDot[event.status] ?? "bg-primary"}`}
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

          <DrawerHeader className="shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <DrawerTitle>{product.name}</DrawerTitle>
                <DrawerDescription>
                  {product.brand}
                  {product.weight ? ` · ${product.weight}` : ""}
                </DrawerDescription>
              </div>
              {batch && (
                <Badge variant={batchBadgeVariant[batch.status] ?? "default"}>
                  {batchStatusLabel[batch.status] ?? "OK"}
                </Badge>
              )}
            </div>
          </DrawerHeader>

          <div
            className={`flex-1 space-y-4 overscroll-y-contain pb-[max(1.5rem,env(safe-area-inset-bottom))] ${
              isFullyOpen ? "overflow-y-auto" : "overflow-hidden"
            }`}
          >
            <div className="grid grid-cols-3 gap-2 px-4">
              {[
                { label: "Origin", value: product.origin ?? "-" },
                { label: "Nutri-Score", value: product.nutriScore ?? "-" },
                {
                  label: "CO₂",
                  value: batch?.co2Kg != null ? `${batch.co2Kg} kg` : "-",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-muted px-3 py-2 text-center"
                >
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="mt-0.5 text-sm font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>

            <Separator />

            {product.certifications.length > 0 && (
              <>
                <div className="flex flex-wrap gap-1.5 px-4">
                  {product.certifications.map((certification) => (
                    <Badge key={certification} variant="secondary">
                      {certification}
                    </Badge>
                  ))}
                </div>
                <Separator />
              </>
            )}

            <div className="space-y-1 px-4">
              <h3 className="text-sm font-semibold">Ingredients</h3>
              <p className="text-sm text-muted-foreground">
                Cocoa mass, sugar, cocoa butter, vanilla extract. Cocoa solids:
                70% minimum.
              </p>
            </div>

            <Separator />

            <div className="space-y-2 px-4">
              <h3 className="text-sm font-semibold">Nutrition Facts</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {[
                  { label: "Energy", value: `${product.nutrition.energyKcal} kcal` },
                  { label: "Fat", value: `${product.nutrition.fat} g` },
                  { label: "Saturated Fat", value: `${product.nutrition.saturatedFat} g` },
                  { label: "Carbohydrates", value: `${product.nutrition.carbs} g` },
                  { label: "Sugars", value: `${product.nutrition.sugars} g` },
                  { label: "Protein", value: `${product.nutrition.protein} g` },
                  { label: "Salt", value: `${product.nutrition.salt} g` },
                  { label: "Fibre", value: `${product.nutrition.fiber} g` },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between border-b border-border/50 py-1"
                  >
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
                    {batch?.co2Kg != null ? `${batch.co2Kg} kg CO₂e` : "-"}
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
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
