import { WebSocketServer, WebSocket } from "ws";

const PORT = 8081;

const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server running on ws://localhost:${PORT}`);

wss.on("connection", (socket: WebSocket) => {
  console.log("Client connected. Total clients:", wss.clients.size);

  socket.send(JSON.stringify({ type: "welcome", message: "Connected to TransitPulse" }));

  socket.on("message", (data) => {
    const text = data.toString();
    console.log("Received from client:", text);
    socket.send(JSON.stringify({ type: "echo", youSent: text }));
  });

  socket.on("close", () => {
    console.log("Client disconnected. Total clients:", wss.clients.size);
  });
});