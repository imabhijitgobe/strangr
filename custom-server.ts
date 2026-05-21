import { createServer } from "http";
import next from "next";
import { Server, Socket } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface WaitingUser {
  socket: Socket;
  interests: string[];
}

interface UserCountry {
  name: string;
  flag: string;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    maxHttpBufferSize: 6e6,
  });

  // --- Socket.IO Logic ---
  let waitingQueue: WaitingUser[] = [];
  const activeSessions = new Map<string, string>();
  const userCountries = new Map<string, UserCountry>();

  function findMatch(user: WaitingUser): WaitingUser | null {
    if (waitingQueue.length === 0) return null;

    if (user.interests.length > 0) {
      const matchIndex = waitingQueue.findIndex(
        (waiting) =>
          waiting.socket.id !== user.socket.id &&
          waiting.interests.some((interest) => user.interests.includes(interest))
      );
      if (matchIndex !== -1) return waitingQueue.splice(matchIndex, 1)[0];
    }

    const anyMatchIndex = waitingQueue.findIndex(
      (waiting) => waiting.socket.id !== user.socket.id
    );
    if (anyMatchIndex !== -1) return waitingQueue.splice(anyMatchIndex, 1)[0];
    return null;
  }

  function getMatchedInterests(a: string[], b: string[]): string[] {
    return a.filter((interest) => b.includes(interest));
  }

  io.on("connection", (socket: Socket) => {
    console.log(`[+] ${socket.id}`);

    socket.on("set-country", (data: { name: string; flag: string }) => {
      if (data.name && data.flag) userCountries.set(socket.id, data);
    });

    socket.on("find-partner", (data: { interests: string[]; country?: { name: string; flag: string } }) => {
      const interests = data.interests || [];
      if (data.country?.name && data.country?.flag) {
        userCountries.set(socket.id, { name: data.country.name, flag: data.country.flag });
      }

      waitingQueue = waitingQueue.filter((u) => u.socket.id !== socket.id);

      const currentPartner = activeSessions.get(socket.id);
      if (currentPartner) {
        io.sockets.sockets.get(currentPartner)?.emit("partner-disconnected");
        activeSessions.delete(socket.id);
        activeSessions.delete(currentPartner);
      }

      const user: WaitingUser = { socket, interests };
      const match = findMatch(user);

      if (match) {
        const matchedInterests = getMatchedInterests(interests, match.interests);
        activeSessions.set(socket.id, match.socket.id);
        activeSessions.set(match.socket.id, socket.id);

        socket.emit("partner-found", { matchedInterests, country: userCountries.get(match.socket.id) || null });
        match.socket.emit("partner-found", { matchedInterests, country: userCountries.get(socket.id) || null });
      } else {
        waitingQueue.push(user);
        socket.emit("waiting");
      }
    });

    socket.on("send-message", (data: { content: string }) => {
      const partnerId = activeSessions.get(socket.id);
      if (!partnerId) return;
      io.sockets.sockets.get(partnerId)?.emit("receive-message", { content: data.content, timestamp: new Date().toISOString() });
    });

    socket.on("send-image", (data: { data: string; mimeType: string; timer?: number; mediaKind?: string }) => {
      const partnerId = activeSessions.get(socket.id);
      if (!partnerId) return;
      if (data.data.length > 6_000_000) { socket.emit("error-message", { content: "File too large." }); return; }
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit("receive-image", { data: data.data, mimeType: data.mimeType, timer: data.timer ?? 5, mediaKind: data.mediaKind || "image", timestamp: new Date().toISOString() });
        socket.emit("image-sent", { timestamp: new Date().toISOString(), mediaKind: data.mediaKind || "image" });
      }
    });

    socket.on("media-viewed", () => {
      const partnerId = activeSessions.get(socket.id);
      if (!partnerId) return;
      io.sockets.sockets.get(partnerId)?.emit("partner-viewed-media", { timestamp: new Date().toISOString() });
    });

    socket.on("typing", () => {
      const partnerId = activeSessions.get(socket.id);
      if (partnerId) io.sockets.sockets.get(partnerId)?.emit("partner-typing");
    });

    socket.on("stop-typing", () => {
      const partnerId = activeSessions.get(socket.id);
      if (partnerId) io.sockets.sockets.get(partnerId)?.emit("partner-stop-typing");
    });

    socket.on("user-away", () => {
      const partnerId = activeSessions.get(socket.id);
      if (partnerId) io.sockets.sockets.get(partnerId)?.emit("partner-away");
    });

    socket.on("user-back", () => {
      const partnerId = activeSessions.get(socket.id);
      if (partnerId) io.sockets.sockets.get(partnerId)?.emit("partner-back");
    });

    socket.on("disconnect-chat", () => {
      const partnerId = activeSessions.get(socket.id);
      if (partnerId) {
        io.sockets.sockets.get(partnerId)?.emit("partner-disconnected", { reason: "skipped" });
        activeSessions.delete(socket.id);
        activeSessions.delete(partnerId);
      }
      waitingQueue = waitingQueue.filter((u) => u.socket.id !== socket.id);
    });

    socket.on("cancel-search", () => {
      waitingQueue = waitingQueue.filter((u) => u.socket.id !== socket.id);
    });

    socket.on("disconnect", () => {
      const partnerId = activeSessions.get(socket.id);
      if (partnerId) {
        io.sockets.sockets.get(partnerId)?.emit("partner-disconnected", { reason: "left" });
        activeSessions.delete(partnerId);
      }
      activeSessions.delete(socket.id);
      userCountries.delete(socket.id);
      waitingQueue = waitingQueue.filter((u) => u.socket.id !== socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Strangr running on http://${hostname}:${port}`);
  });
});
