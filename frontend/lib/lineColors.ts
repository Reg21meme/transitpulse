// Single source of truth for MBTA line colors.
// Matches official MBTA branding; used by map + dashboard.

export function routeColor(routeId: string): string {
  if (routeId === "Red") return "#DA291C";
  if (routeId === "Orange") return "#ED8B00";
  if (routeId === "Blue") return "#003DA5";
  if (routeId.startsWith("Green")) return "#00843D";
  return "#888888";
}