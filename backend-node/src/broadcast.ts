import { WebSocketServer, WebSocket } from "ws";
import { Vehicle } from "./mbtaStream.js";

// Cache the most recent vehicles so new clients get data instantly.
let lastVehicles: Vehicle[] = [];

export function broadcastVehicles(wss: WebSocketServer, vehicles: Vehicle[]) {
  lastVehicles = vehicles; // remember for new clients
  const message = JSON.stringify({
    type: "vehicles",
    count: vehicles.length,
    data: vehicles,
  });

  let sent = 0;
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sent++;
    }
  }
  return sent;
}

// Send the cached vehicles to a single client (used right when they connect).
export function sendSnapshot(socket: WebSocket) {
  if (lastVehicles.length === 0) return;
  socket.send(JSON.stringify({
    type: "vehicles",
    count: lastVehicles.length,
    data: lastVehicles,
  }));
}