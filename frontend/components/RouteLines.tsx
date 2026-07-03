"use client";

import { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";

function routeColor(routeId: string): string {
  if (routeId === "Red") return "#DA291C";
  if (routeId === "Orange") return "#ED8B00";
  if (routeId === "Blue") return "#003DA5";
  if (routeId.startsWith("Green")) return "#00843D";
  return "#888888";
}

interface RouteShape {
  routeId: string;
  paths: [number, number][][];
}

export default function RouteLines() {
  const [shapes, setShapes] = useState<RouteShape[]>([]);

  useEffect(() => {
    fetch("/shapes.json")
      .then((res) => res.json())
      .then((data: RouteShape[]) => setShapes(data))
      .catch((err) => console.error("Failed to load shapes:", err));
  }, []);

  return (
    <>
      {shapes.map((route) =>
        route.paths.map((path, i) => (
          <Polyline
            key={`${route.routeId}-${i}`}
            positions={path}
            pathOptions={{
              color: routeColor(route.routeId),
              weight: 3,
              opacity: 0.6,
            }}
          />
        ))
      )}
    </>
  );
}