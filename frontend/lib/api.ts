// Typed fetch layer for the Django analytics endpoints.
// Base URL can be overridden with NEXT_PUBLIC_API_URL; defaults to local Django.

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// ---- Response types (mirror the Django endpoints exactly) ----

export interface ReliabilityOverall {
  count: number;
  on_time: number;
  reliability_pct: number | null;
  threshold: number;
}

export interface ReliabilityByLine {
  route_id: string;
  count: number;
  on_time: number;
  reliability_pct: number;
}

export interface ReliabilityResponse {
  overall: ReliabilityOverall;
  by_line: ReliabilityByLine[];
}

export interface DelayByLine {
  route_id: string;
  count: number;
  avg_delay_minutes: number;
}

export interface DelayByStop {
  stop_id: string;
  count: number;
  avg_delay_minutes: number;
}

export interface DelayByHour {
  hour: number;
  count: number;
  avg_delay_minutes: number;
}

// ---- Fetch helper ----

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export const getDelaysByLineHour = () =>
  getJSON<DelayByLineHour[]>("/analytics/delays/by-line-hour/");

export const getDashboard = () =>
  getJSON<DashboardData>("/analytics/dashboard/");
// ---- Endpoint functions ----

export const getReliability = () =>
  getJSON<ReliabilityResponse>("/analytics/reliability/");

export const getDelaysByLine = () =>
  getJSON<DelayByLine[]>("/analytics/delays/by-line/");

export const getDelaysByStop = () =>
  getJSON<DelayByStop[]>("/analytics/delays/by-stop/");

export const getDelaysByHour = () =>
  getJSON<DelayByHour[]>("/analytics/delays/by-hour/");
export interface DelayByLineHour {
  route_id: string;
  hour: number;
  count: number;
  avg_delay_minutes: number;
}
export interface DashboardData {
  reliability: ReliabilityResponse;
  delays_by_line: DelayByLine[];
  delays_by_stop: DelayByStop[];
  delays_by_hour: DelayByHour[];
  delays_by_line_hour: DelayByLineHour[];
}