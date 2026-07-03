"use client";

import { useEffect, useState } from "react";
import { CircleMarker, Popup } from "react-leaflet";

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isPlatform: boolean;
}

export default function Stations() {
  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    fetch("/stations.json")
      .then((res) => res.json())
      .then((data: Station[]) => setStations(data))
      .catch((err) => console.error("Failed to load stations:", err));
  }, []);

  return (
    <>
      {stations
        .filter((s) => !s.isPlatform)
        .map((s) => (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={4}
            pathOptions={{
              color: "#ffffff",
              weight: 1.5,
              fillColor: "#1a1a1a",
              fillOpacity: 1,
            }}
          >
            <Popup>{s.name}</Popup>
          </CircleMarker>
        ))}
    </>
  );
}