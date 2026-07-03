import { WebSocketServer, WebSocket } from "ws";
import { startMbtaPolling, Vehicle } from "./mbtaStream.js";
import { broadcastVehicles } from "./broadcast.js";

const PORT = 8081;
const wss = new WebSocketServer({ port: PORT });
console.log(`WebSocket server running on ws://localhost:${PORT}`);

wss.on("connection", (socket: WebSocket) => {
  console.log("Client connected. Total clients:", wss.clients.size);
  socket.on("close", () => {
    console.log("Client disconnected. Total clients:", wss.clients.size);
  });
});

// Every poll cycle, broadcast the fresh vehicles to all connected clients
startMbtaPolling((vehicles: Vehicle[]) => {
  const sent = broadcastVehicles(wss, vehicles);
  console.log(`Broadcast ${vehicles.length} vehicles to ${sent} client(s).`);
});