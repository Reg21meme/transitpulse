import { WebSocketServer, WebSocket } from "ws";
import { Vehicle } from "./mbtaStream.js";

// Send the given vehicles to every connected client as a JSON message.
export function broadcastVehicles(wss: WebSocketServer, vehicles: Vehicle[]) {
  const message = JSON.stringify({
    type: "vehicles",
    count: vehicles.length,
    data: vehicles,
  });

  let sent = 0;
  for (const client of wss.clients) {
    // Only send to clients whose connection is actually open
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sent++;
    }
  }
  return sent;
}