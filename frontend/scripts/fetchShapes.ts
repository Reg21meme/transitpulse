import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { writeFileSync } from "fs";
import polyline from "@mapbox/polyline";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", "..", ".env") });

const API_KEY = process.env.MBTA_API_KEY;
const BASE_URL = "https://api-v3.mbta.com";
const SUBWAY_ROUTES = ["Red", "Orange", "Blue", "Green-B", "Green-C", "Green-D", "Green-E"];

interface RouteShape {
  routeId: string;
  paths: [number, number][][]; // one route can have multiple path segments
}

async function fetchShapesForRoute(routeId: string): Promise<[number, number][][]> {
  // Get the route's canonical patterns, including their shapes
  const url =
    `${BASE_URL}/route_patterns?filter[route]=${routeId}` +
    `&filter[canonical]=true&include=representative_trip.shape&api_key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`${routeId}: MBTA returned ${res.status}`);
  const json = await res.json();

  // The shapes come back in the "included" array as type "shape"
  const included = json.included ?? [];
  const paths: [number, number][][] = [];

  for (const item of included) {
    if (item.type === "shape" && item.attributes?.polyline) {
      // Decode the encoded polyline into [lat, lng] pairs
      const decoded = polyline.decode(item.attributes.polyline) as [number, number][];
      if (decoded.length > 1) paths.push(decoded);
    }
  }
  return paths;
}

async function main() {
  const allShapes: RouteShape[] = [];

  for (const routeId of SUBWAY_ROUTES) {
    try {
      const paths = await fetchShapesForRoute(routeId);
      allShapes.push({ routeId, paths });
      console.log(`${routeId}: ${paths.length} path(s), ${paths.reduce((n, p) => n + p.length, 0)} points`);
    } catch (err) {
      console.error(`Failed for ${routeId}:`, err);
    }
  }

  const outPath = join(__dirname, "..", "public", "shapes.json");
  writeFileSync(outPath, JSON.stringify(allShapes));
  console.log(`\nSaved ${allShapes.length} route shapes to public/shapes.json`);
}

main();