export type Point = [number, number];

interface RouteShape {
  routeId: string;
  paths: Point[][];
}

// Flattened, cached track paths per route
let cachedShapes: RouteShape[] | null = null;

export async function loadShapes(): Promise<RouteShape[]> {
  if (cachedShapes) return cachedShapes;
  const res = await fetch("/shapes.json");
  cachedShapes = await res.json();
  return cachedShapes!;
}

function distSq(a: Point, b: Point): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

// Project point p onto segment a-b, return the closest point on the segment
function projectOnSegment(p: Point, a: Point, b: Point): Point {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return a;
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return [a[0] + t * dx, a[1] + t * dy];
}

// Given a route's paths, find the best path and the index+point where p snaps
export function snapToTrack(
  p: Point,
  paths: Point[][]
): { path: Point[]; segIndex: number; point: Point } | null {
  let best: { path: Point[]; segIndex: number; point: Point; d: number } | null = null;

  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const proj = projectOnSegment(p, path[i], path[i + 1]);
      const d = distSq(p, proj);
      if (!best || d < best.d) {
        best = { path, segIndex: i, point: proj, d };
      }
    }
  }
  if (!best) return null;
  return { path: best.path, segIndex: best.segIndex, point: best.point };
}

// Walk along a path from one snapped position to another, returning the
// intermediate point at progress t (0..1). Follows the polyline curve.
export function pointAlongPath(
  path: Point[],
  fromSeg: number,
  fromPt: Point,
  toSeg: number,
  toPt: Point,
  t: number
): Point {
  // Build the ordered list of points from -> to along the path
  const pts: Point[] = [];
  if (fromSeg <= toSeg) {
    pts.push(fromPt);
    for (let i = fromSeg + 1; i <= toSeg; i++) pts.push(path[i]);
    pts.push(toPt);
  } else {
    pts.push(fromPt);
    for (let i = fromSeg; i > toSeg; i--) pts.push(path[i]);
    pts.push(toPt);
  }

  // Total length along pts
  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.sqrt(distSq(pts[i], pts[i + 1]));
    segLens.push(d);
    total += d;
  }
  if (total === 0) return fromPt;

  let target = t * total;
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i]) {
      const frac = segLens[i] === 0 ? 0 : target / segLens[i];
      return [
        pts[i][0] + (pts[i + 1][0] - pts[i][0]) * frac,
        pts[i][1] + (pts[i + 1][1] - pts[i][1]) * frac,
      ];
    }
    target -= segLens[i];
  }
  return toPt;
}