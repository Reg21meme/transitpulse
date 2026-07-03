"use client";

import { useEffect, useState } from "react";

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

const WS_URL = "ws://localhost:8081";

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "vehicles") {
          setVehicles(msg.data);
        }
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    return () => {
      ws.close();
    };
  }, []);

  return { vehicles, connected };
}