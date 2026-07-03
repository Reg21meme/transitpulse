"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLngBoundsExpression } from "leaflet";
import { useVehicles } from "@/hooks/useWebSocket";
import AnimatedVehicles from "@/components/AnimatedVehicles";
import RouteLines from "@/components/RouteLines";
import Stations from "@/components/Stations";

const BOSTON_CENTER: [number, number] = [42.3555, -71.0605];
const DEFAULT_ZOOM = 12;

const MBTA_BOUNDS: LatLngBoundsExpression = [
  [42.20, -71.30],
  [42.47, -70.90],
];

export default function LiveMap() {
  const [mounted, setMounted] = useState(false);
  const { vehicles } = useVehicles();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 1000,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "8px 14px",
          borderRadius: 8,
          fontFamily: "sans-serif",
          fontSize: 14,
        }}
      >
        🟢 {vehicles.length} trains live
      </div>

      <MapContainer
        center={BOSTON_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={11}
        maxZoom={16}
        maxBounds={MBTA_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: "100vh", width: "100%", background: "#1a1a1a" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <RouteLines />
        <Stations />
        <AnimatedVehicles vehicles={vehicles} />
      </MapContainer>
    </div>
  );
}