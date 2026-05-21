import { createServer } from "http";
import { Server, Socket } from "socket.io";

const PORT = 3001;

interface WaitingUser {
  socket: Socket;
  interests: string[];
}

interface UserCountry {
  name: string;
  flag: string;
}

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 6e6, // 6MB for base64 video/images
});

// Queue of users waiting to be matched
let waitingQueue: WaitingUser[] = [];

// Active chat sessions (socketId -> partnerId)
const activeSessions = new Map<string, string>();

// User countries (socketId -> country)
const userCountries = new Map<string, UserCountry>();

function findMatch(user: WaitingUser): WaitingUser | null {
  if (waitingQueue.length === 0) return null;

  // Try to find someone with matching interests first
  if (user.interests.length > 0) {
    const matchIndex = waitingQueue.findIndex(
      (waiting) =>
        waiting.socket.id !== user.socket.id &&
        waiting.interests.some((interest) =>
          user.interests.includes(interest)
        )
    );

    if (matchIndex !== -1) {
      return waitingQueue.splice(matchIndex, 1)[0];
    }
  }

  // Otherwise, match with anyone in the queue
  const anyMatchIndex = waitingQueue.findIndex(
    (waiting) => waiting.socket.id !== user.socket.id
  );

  if (anyMatchIndex !== -1) {
    return waitingQueue.splice(anyMatchIndex, 1)[0];
  }

  return null;
}

function getMatchedInterests(a: string[], b: string[]): string[] {
  return a.filter((interest) => b.includes(interest));
}

io.on("connection", (socket: Socket) => {
  console.log(`[+] User connected: ${socket.id}`);

  // User sets their country
  socket.on("set-country", (data: { name: string; flag: string }) => {
    if (data.name && data.flag) {
      userCountries.set(socket.id, { name: data.name, flag: data.flag });
    }
  });

  // User wants to find a chat partner
  socket.on("find-partner", (data: { interests: string[]; country?: { name: string; flag: string } }) => {
    const interests = data.interests || [];

    // Store country if provided with find-partner (ensures it's set before matching)
    if (data.country?.name && data.country?.flag) {
      userCountries.set(socket.id, { name: data.country.name, flag: data.country.flag });
    }

    console.log(
      `[~] ${socket.id} looking for partner with interests: [${interests.join(", ")}]`
    );

    // Remove from queue if already there
    waitingQueue = waitingQueue.filter((u) => u.socket.id !== socket.id);

    // Disconnect from current partner if any
    const currentPartner = activeSessions.get(socket.id);
    if (currentPartner) {
      const partnerSocket = io.sockets.sockets.get(currentPartner);
      if (partnerSocket) {
        partnerSocket.emit("partner-disconnected");
      }
      activeSessions.delete(socket.id);
      activeSessions.delete(currentPartner);
    }

    const user: WaitingUser = { socket, interests };
    const match = findMatch(user);

    if (match) {
      // Found a match — connect them
      const matchedInterests = getMatchedInterests(interests, match.interests);

      activeSessions.set(socket.id, match.socket.id);
      activeSessions.set(match.socket.id, socket.id);

      console.log(
        `[✓] Matched: ${socket.id} <-> ${match.socket.id} (shared: [${matchedInterests.join(", ")}])`
      );

      socket.emit("partner-found", {
        matchedInterests,
        country: userCountries.get(match.socket.id) || null,
      });

      match.socket.emit("partner-found", {
        matchedInterests,
        country: userCountries.get(socket.id) || null,
      });
    } else {
      // No match found — add to queue
      waitingQueue.push(user);
      socket.emit("waiting");
      console.log(
        `[…] ${socket.id} added to queue. Queue size: ${waitingQueue.length}`
      );
    }
  });

  // User sends a message to their partner
  socket.on("send-message", (data: { content: string }) => {
    const partnerId = activeSessions.get(socket.id);
    if (!partnerId) return;

    const partnerSocket = io.sockets.sockets.get(partnerId);
    if (partnerSocket) {
      partnerSocket.emit("receive-message", {
        content: data.content,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // User sends a view-once media to their partner
  socket.on("send-image", (data: { data: string; mimeType: string; timer?: number; mediaKind?: string }) => {
    const partnerId = activeSessions.get(socket.id);
    if (!partnerId) return;

    // Validate size (max ~6MB base64 for video)
    if (data.data.length > 6_000_000) {
      socket.emit("error-message", { content: "File too large." });
      return;
    }

    const partnerSocket = io.sockets.sockets.get(partnerId);
    if (partnerSocket) {
      partnerSocket.emit("receive-image", {
        data: data.data,
        mimeType: data.mimeType,
        timer: data.timer ?? 5,
        mediaKind: data.mediaKind || "image",
        timestamp: new Date().toISOString(),
      });
      // Confirm to sender
      socket.emit("image-sent", { timestamp: new Date().toISOString(), mediaKind: data.mediaKind || "image" });
      console.log(`[📷] ${socket.id} sent view-once ${data.mediaKind || "image"} (${data.timer ?? 5}s) to ${partnerId}`);
    }
  });

  // Receiver opened a view-once media
  socket.on("media-viewed", () => {
    const partnerId = activeSessions.get(socket.id);
    if (!partnerId) return;

    const partnerSocket = io.sockets.sockets.get(partnerId);
    if (partnerSocket) {
      partnerSocket.emit("partner-viewed-media", {
        timestamp: new Date().toISOString(),
      });
    }
  });

  // User is typing
  socket.on("typing", () => {
    const partnerId = activeSessions.get(socket.id);
    if (!partnerId) return;

    const partnerSocket = io.sockets.sockets.get(partnerId);
    if (partnerSocket) {
      partnerSocket.emit("partner-typing");
    }
  });

  // User stopped typing
  socket.on("stop-typing", () => {
    const partnerId = activeSessions.get(socket.id);
    if (!partnerId) return;

    const partnerSocket = io.sockets.sockets.get(partnerId);
    if (partnerSocket) {
      partnerSocket.emit("partner-stop-typing");
    }
  });

  // User switched to another tab/app
  socket.on("user-away", () => {
    console.log(`[👁] ${socket.id} went away`);
    const partnerId = activeSessions.get(socket.id);
    if (!partnerId) {
      console.log(`    No partner found for ${socket.id}`);
      return;
    }

    const partnerSocket = io.sockets.sockets.get(partnerId);
    if (partnerSocket) {
      partnerSocket.emit("partner-away");
      console.log(`    Notified partner ${partnerId}`);
    }
  });

  // User came back to the tab
  socket.on("user-back", () => {
    console.log(`[👁] ${socket.id} came back`);
    const partnerId = activeSessions.get(socket.id);
    if (!partnerId) return;

    const partnerSocket = io.sockets.sockets.get(partnerId);
    if (partnerSocket) {
      partnerSocket.emit("partner-back");
      console.log(`    Notified partner ${partnerId}`);
    }
  });

  // User disconnects from chat (clicks "Next")
  socket.on("disconnect-chat", () => {
    const partnerId = activeSessions.get(socket.id);
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit("partner-disconnected", { reason: "skipped" });
      }
      activeSessions.delete(socket.id);
      activeSessions.delete(partnerId);
      console.log(`[x] ${socket.id} disconnected from ${partnerId}`);
    }

    // Remove from queue
    waitingQueue = waitingQueue.filter((u) => u.socket.id !== socket.id);
  });

  // User leaves entirely (closes tab, etc.)
  socket.on("disconnect", () => {
    console.log(`[-] User disconnected: ${socket.id}`);

    // Notify partner
    const partnerId = activeSessions.get(socket.id);
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit("partner-disconnected", { reason: "left" });
      }
      activeSessions.delete(partnerId);
    }
    activeSessions.delete(socket.id);
    userCountries.delete(socket.id);

    // Remove from queue
    waitingQueue = waitingQueue.filter((u) => u.socket.id !== socket.id);
    console.log(`    Queue size: ${waitingQueue.length}`);
  });

  // Cancel search
  socket.on("cancel-search", () => {
    waitingQueue = waitingQueue.filter((u) => u.socket.id !== socket.id);
    console.log(
      `[x] ${socket.id} cancelled search. Queue size: ${waitingQueue.length}`
    );
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Strangr server running on http://localhost:${PORT}\n`);
  console.log(`   Open two browser tabs at http://localhost:3000/chat`);
  console.log(`   Click "START CHATTING" in both to test matching\n`);
});
