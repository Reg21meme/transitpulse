import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", "..", ".env") });

const API_KEY = process.env.MBTA_API_KEY;
const BASE_URL = "https://api-v3.mbta.com";
const SUBWAY_ROUTES = ["Red", "Orange", "Blue", "Green-B", "Green-C", "Green-D", "Green-E"];
const POLL_INTERVAL_MS = 1500;

// The shape of one cleaned-up vehicle we care about
export interface Vehicle {
  id: string;
  routeId: string;
  tripId: string;
  stopId: string;
  status: string;
  latitude: number;
  longitude: number;
  bearing: number | null;
  directionId: number | null;
  updatedAt: string;
}

async function fetchVehicles(): Promise<Vehicle[]> {
  const routes = SUBWAY_ROUTES.join(",");
  const url = `${BASE_URL}/vehicles?filter[route]=${routes}&api_key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`MBTA API returned ${res.status}`);
  }

  const json = await res.json();

  const vehicles: Vehicle[] = [];
  for (const v of json.data) {
    const attrs = v.attributes;
    const routeData = v.relationships?.route?.data;
    if (!routeData || attrs.latitude == null) continue;

    vehicles.push({
      id: v.id,
      routeId: routeData.id,
      tripId: v.relationships?.trip?.data?.id ?? "",
      stopId: v.relationships?.stop?.data?.id ?? "",
      status: attrs.current_status ?? "",
      latitude: attrs.latitude,
      longitude: attrs.longitude,
      bearing: attrs.bearing ?? null,
      directionId: attrs.direction_id ?? null,
      updatedAt: attrs.updated_at,
    });
  }
  return vehicles;
}

// Start polling. Calls `onUpdate` with fresh vehicles each cycle.
export function startMbtaPolling(onUpdate: (vehicles: Vehicle[]) => void) {
  async function poll() {
    try {
      const vehicles = await fetchVehicles();
      onUpdate(vehicles);
    } catch (err) {
      console.error("MBTA poll failed:", err);
    }
  }

  poll(); // run immediately
  setInterval(poll, POLL_INTERVAL_MS); // then every 4s
}