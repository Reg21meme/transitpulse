import { WebSocketServer, WebSocket } from "ws";
import { startMbtaPolling, Vehicle } from "./mbtaStream.js";

const PORT = 8081;
const wss = new WebSocketServer({ port: PORT });
console.log(`WebSocket server running on ws://localhost:${PORT}`);

wss.on("connection", (socket: WebSocket) => {
  console.log("Client connected. Total clients:", wss.clients.size);
  socket.on("close", () => {
    console.log("Client disconnected. Total clients:", wss.clients.size);
  });
});

// For now: just log how many trains we fetched each cycle
startMbtaPolling((vehicles: Vehicle[]) => {
  console.log(`Fetched ${vehicles.length} vehicles. Sample:`, vehicles[0]);
});