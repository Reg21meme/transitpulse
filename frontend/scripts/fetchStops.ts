import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { writeFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", "..", ".env") });

const API_KEY = process.env.MBTA_API_KEY;
const BASE_URL = "https://api-v3.mbta.com";
const SUBWAY_ROUTES = ["Red", "Orange", "Blue", "Green-B", "Green-C", "Green-D", "Green-E"];

interface StationInfo {
  id: string;        // platform id (70xxx)
  parentId: string;  // parent station id (place-xxxx)
  name: string;
  lat: number;       // parent station coords
  lng: number;
}

interface RouteSequence {
  routeId: string;
  directionId: number;
  stops: StationInfo[]; // in travel order
}

async function fetchParentInfo(): Promise<Record<string, { name: string; lat: number; lng: number }>> {
  const parents: Record<string, { name: string; lat: number; lng: number }> = {};
  for (const routeId of SUBWAY_ROUTES) {
    const url = `${BASE_URL}/stops?filter[route]=${routeId}&api_key=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const json = await res.json();
    for (const s of json.data) {
      const a = s.attributes;
      if (a?.latitude != null) parents[s.id] = { name: a.name, lat: a.latitude, lng: a.longitude };
    }
  }
  return parents;
}

async function main() {
  const parents = await fetchParentInfo();
  const sequences: RouteSequence[] = [];
  const drawnStations: Record<string, { id: string; name: string; lat: number; lng: number }> = {};

  for (const routeId of SUBWAY_ROUTES) {
    for (const directionId of [0, 1]) {
      // Canonical route pattern's trip gives the ordered stops
      const url =
        `${BASE_URL}/stops?filter[route]=${routeId}&filter[direction_id]=${directionId}` +
        `&include=parent_station&api_key=${API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`${routeId} dir ${directionId}: ${res.status}`);
        continue;
      }
      const json = await res.json();

      const stops: StationInfo[] = [];
      for (const s of json.data) {
        const a = s.attributes;
        const parentId = s.relationships?.parent_station?.data?.id ?? s.id;
        const p = parents[parentId] ?? { name: a.name, lat: a.latitude, lng: a.longitude };
        if (p.lat == null) continue;
        stops.push({ id: s.id, parentId, name: p.name, lat: p.lat, lng: p.lng });
        drawnStations[parentId] = { id: parentId, name: p.name, lat: p.lat, lng: p.lng };
      }
      sequences.push({ routeId, directionId, stops });
    }
  }

  writeFileSync(join(__dirname, "..", "public", "sequences.json"), JSON.stringify(sequences));
  writeFileSync(join(__dirname, "..", "public", "stations.json"), JSON.stringify(Object.values(drawnStations)));
  console.log(`Saved ${sequences.length} route sequences and ${Object.keys(drawnStations).length} stations`);
}

main();