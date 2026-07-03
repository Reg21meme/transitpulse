import { WebSocketServer, WebSocket } from "ws";
import { startMbtaPolling, Vehicle } from "./mbtaStream.js";
import { broadcastVehicles, sendSnapshot } from "./broadcast.js";

const PORT = 8081;
const HEARTBEAT_INTERVAL_MS = 30000;

const wss = new WebSocketServer({ port: PORT });
console.log(`WebSocket server running on ws://localhost:${PORT}`);

// Track liveness per socket for the heartbeat.
interface LiveSocket extends WebSocket {
  isAlive?: boolean;
}

wss.on("connection", (socket: LiveSocket) => {
  socket.isAlive = true;
  socket.on("pong", () => { socket.isAlive = true; });

  console.log("Client connected. Total clients:", wss.clients.size);

  // Give the new client the latest data immediately (no blank wait).
  sendSnapshot(socket);

  socket.on("close", () => {
    console.log("Client disconnected. Total clients:", wss.clients.size);
  });
});

// Heartbeat: every 30s, ping clients; drop any that didn't respond.
const heartbeat = setInterval(() => {
  for (const client of wss.clients) {
    const socket = client as LiveSocket;
    if (socket.isAlive === false) {
      console.log("Terminating unresponsive client.");
      socket.terminate();
      continue;
    }
    socket.isAlive = false;
    socket.ping();
  }
}, HEARTBEAT_INTERVAL_MS);

wss.on("close", () => clearInterval(heartbeat));

// Poll MBTA and broadcast to all clients.
startMbtaPolling((vehicles: Vehicle[]) => {
  const sent = broadcastVehicles(wss, vehicles);
  console.log(`Broadcast ${vehicles.length} vehicles to ${sent} client(s).`);
});