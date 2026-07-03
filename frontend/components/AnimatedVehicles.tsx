"use client";

import { useEffect, useRef, useState } from "react";
import { CircleMarker, Popup } from "react-leaflet";
import type { Vehicle } from "@/hooks/useWebSocket";
import { loadShapes, snapToTrack, pointAlongPath, type Point } from "@/components/trackUtils";

function routeColor(routeId: string): string {
  if (routeId === "Red") return "#DA291C";
  if (routeId === "Orange") return "#ED8B00";
  if (routeId === "Blue") return "#003DA5";
  if (routeId.startsWith("Green")) return "#00843D";
  return "#888888";
}

const SPEED_DEG_PER_MS = 0.0000002;

interface Anim {
  path: Point[];
  fromSeg: number;
  fromPt: Point;
  toSeg: number;
  toPt: Point;
  startTime: number;
  durationMs: number;
  targetName: string;
  arrived: boolean; // is the train sitting AT the target station?
}

interface ShapeData {
  routeId: string;
  paths: Point[][];
}

interface SeqStop {
  id: string;
  parentId: string;
  name: string;
  lat: number;
  lng: number;
}

interface RouteSequence {
  routeId: string;
  directionId: number;
  stops: SeqStop[];
}

function dist(a: Point, b: Point): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

export default function AnimatedVehicles({ vehicles }: { vehicles: Vehicle[] }) {
  const [positions, setPositions] = useState<Record<string, Point>>({});
  // Bump this to force label re-render as trains arrive/depart
  const [, setTick] = useState(0);
  const anims = useRef<Record<string, Anim>>({});
  const shapesRef = useRef<Record<string, Point[][]>>({});
  const seqRef = useRef<RouteSequence[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      loadShapes(),
      fetch("/sequences.json").then((r) => r.json()),
    ]).then(([shapes, sequences]: [ShapeData[], RouteSequence[]]) => {
      const byRoute: Record<string, Point[][]> = {};
      for (const s of shapes) byRoute[s.routeId] = s.paths;
      shapesRef.current = byRoute;
      seqRef.current = sequences;
      setReady(true);
    });
  }, []);

  // Target the next station ahead in travel order (or current if stopped)
  function targetInfo(v: Vehicle): { pt: Point; name: string; isStop: boolean } {
    const seq = seqRef.current.find(
      (s) => s.routeId === v.routeId && s.directionId === v.directionId
    );
    const realPos: Point = [v.latitude, v.longitude];
    if (!seq || seq.stops.length === 0) return { pt: realPos, name: "—", isStop: false };

    let closestIdx = 0;
    let closestD = Infinity;
    for (let i = 0; i < seq.stops.length; i++) {
      const d = dist(realPos, [seq.stops[i].lat, seq.stops[i].lng]);
      if (d < closestD) {
        closestD = d;
        closestIdx = i;
      }
    }

    if (v.status === "STOPPED_AT") {
      const s = seq.stops[closestIdx];
      return { pt: [s.lat, s.lng], name: s.name, isStop: true };
    }

    let nextIdx = closestIdx + 1;
    if (closestIdx > 0) {
      const prev = seq.stops[closestIdx - 1];
      const nextC = seq.stops[Math.min(closestIdx + 1, seq.stops.length - 1)];
      const dPrev = dist(realPos, [prev.lat, prev.lng]);
      const dNext = dist(realPos, [nextC.lat, nextC.lng]);
      if (dPrev < dNext) nextIdx = closestIdx;
    }
    nextIdx = Math.min(nextIdx, seq.stops.length - 1);
    const s = seq.stops[nextIdx];
    return { pt: [s.lat, s.lng], name: s.name, isStop: false };
  }

  useEffect(() => {
    if (!ready) return;
    const now = performance.now();

    for (const v of vehicles) {
      const paths = shapesRef.current[v.routeId];
      if (!paths) continue;

      const { pt: targetPt, name, isStop } = targetInfo(v);
      const fromPt: Point = positions[v.id] ?? [v.latitude, v.longitude];

      const fromSnap = snapToTrack(fromPt, paths);
      const toSnap = snapToTrack(targetPt, paths);
      if (!fromSnap || !toSnap) continue;

      const path = toSnap.path;
      const fromOnPath = snapToTrack(fromSnap.point, [path]);
      const startPt = fromOnPath ? fromOnPath.point : fromSnap.point;

      const d = dist(startPt, toSnap.point);
      const duration = Math.max(d / SPEED_DEG_PER_MS, 500);

      anims.current[v.id] = {
        path,
        fromSeg: fromOnPath ? fromOnPath.segIndex : toSnap.segIndex,
        fromPt: startPt,
        toSeg: toSnap.segIndex,
        toPt: toSnap.point,
        startTime: now,
        durationMs: duration,
        targetName: name,
        arrived: isStop,
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, ready]);

  useEffect(() => {
    let frame: number;
    let lastTick = 0;
    function animate() {
      const now = performance.now();
      const next: Record<string, Point> = {};
      for (const id in anims.current) {
        const a = anims.current[id];
        const t = Math.min((now - a.startTime) / a.durationMs, 1);
        next[id] = pointAlongPath(a.path, a.fromSeg, a.fromPt, a.toSeg, a.toPt, t);
      }
      setPositions(next);
      // Update labels ~2x/sec (not every frame, to avoid excess renders)
      if (now - lastTick > 500) {
        lastTick = now;
        setTick((n) => n + 1);
      }
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Label reflects the DOT's actual state: has it reached its target yet?
  function labelFor(v: Vehicle): string {
    const a = anims.current[v.id];
    const name = a ? a.targetName : "—";
    // Use the MBTA status directly — it's stable and won't flicker
    if (v.status === "STOPPED_AT") return `Stopped at ${name}`;
    return `Heading to ${name}`;
  }

  return (
    <>
      {vehicles.map((v) => {
        const pos = positions[v.id] ?? [v.latitude, v.longitude];
        return (
          <CircleMarker
            key={v.id}
            center={pos}
            radius={7}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: routeColor(v.routeId),
              fillOpacity: 1,
            }}
          >
            <Popup>
              <strong>{v.routeId} Line</strong>
              <br />
              {labelFor(v)}
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}