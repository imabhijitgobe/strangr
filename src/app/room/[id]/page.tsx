"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Video, Lock, AlertCircle, ImageIcon } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { getSavedRooms, updateLastVisited, removeRoom, SavedRoom } from "@/lib/rooms";
import { generateId, SOCKET_URL, DEFAULT_TIMER, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } from "@/components/chat/types";
import { MediaViewer } from "@/components/chat/media-viewer";
import { TimerPrompt } from "@/components/chat/timer-prompt";

interface RoomMessage {
  id: string;
  content: string;
  sender: "Person 1" | "Person 2" | "system";
  timestamp: Date;
  type?: "text" | "media";
  mediaData?: string;
  mediaMimeType?: string;
  mediaKind?: "image" | "gif" | "video";
  timer?: number;
  viewed?: boolean;
}

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id as string;

  const [room, setRoom] = React.useState<SavedRoom | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [messages, setMessages] = React.useState<RoomMessage[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);
  const [partnerOnline, setPartnerOnline] = React.useState(false);
  const [viewingMedia, setViewingMedia] = React.useState<string | null>(null);
  const [viewingMediaId, setViewingMediaId] = React.useState<string | null>(null);
  const [viewingMediaKind, setViewingMediaKind] = React.useState<"image" | "gif" | "video" | null>(null);
  const [viewCountdown, setViewCountdown] = React.useState<number | null>(null);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [showTimerPrompt, setShowTimerPrompt] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const socketRef = React.useRef<Socket | null>(null);
  const roomRef = React.useRef<SavedRoom | null>(null);

  React.useEffect(() => {
    const rooms = getSavedRooms();
    const found = rooms.find((r) => r.roomId === roomId);
    if (found) {
      setRoom(found);
      roomRef.current = found;
      updateLastVisited(found.roomId);
      setMessages([
        {
          id: generateId(),
          content: `Welcome to your private room ${found.roomCode}. Messages are live but not persisted yet.`,
          sender: "system",
          timestamp: new Date(),
        },
      ]);
    } else {
      setNotFound(true);
    }
    setLoaded(true);
  }, [roomId]);

  // Socket.IO for real-time room messaging
  React.useEffect(() => {
    if (!room) return;

    const socket = io(SOCKET_URL || undefined, {
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    // Join the room
    socket.emit("join-room", { roomId: room.roomId, alias: room.alias });

    // Partner joined
    socket.on("room-partner-joined", () => {
      setPartnerOnline(true);
      setMessages((prev) => [
        ...prev,
        { id: generateId(), content: "Your partner is online.", sender: "system", timestamp: new Date() },
      ]);
    });

    // Partner left
    socket.on("room-partner-left", () => {
      setPartnerOnline(false);
      setMessages((prev) => [
        ...prev,
        { id: generateId(), content: "Your partner went offline.", sender: "system", timestamp: new Date() },
      ]);
    });

    // Receive message
    socket.on("room-message", (data: { content: string; sender: string; timestamp: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          content: data.content,
          sender: data.sender as "Person 1" | "Person 2",
          timestamp: new Date(data.timestamp),
        },
      ]);
    });

    // Receive media
    socket.on("room-media", (data: { sender: string; mediaData: string; mimeType: string; mediaKind: string; timer: number; timestamp: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          content: "View-once media",
          sender: data.sender as "Person 1" | "Person 2",
          timestamp: new Date(data.timestamp),
          type: "media",
          mediaData: data.mediaData,
          mediaMimeType: data.mimeType,
          mediaKind: data.mediaKind as "image" | "gif" | "video",
          timer: data.timer,
          viewed: false,
        },
      ]);
    });

    // Sender gets notified when partner viewed their media in room
    socket.on("room-media-viewed", () => {
      setMessages((prev) => {
        const lastIdx = [...prev].reverse().findIndex(
          (m) => m.type === "media" && m.sender === roomRef.current?.alias && m.mediaData === "__sent__"
        );
        if (lastIdx === -1) return prev;
        const actualIdx = prev.length - 1 - lastIdx;
        return prev.map((m, i) => i === actualIdx ? { ...m, mediaData: "__opened__" } : m);
      });
    });

    // Partner deleted the room
    socket.on("room-deleted", () => {
      removeRoom(room.roomId);
      window.location.href = "/rooms";
    });

    return () => {
      socket.emit("leave-room", { roomId: room.roomId });
      socket.disconnect();
    };
  }, [room]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !room) return;

    const content = inputValue.trim();

    setMessages((prev) => [
      ...prev,
      { id: generateId(), content, sender: room.alias, timestamp: new Date() },
    ]);

    socketRef.current?.emit("room-send-message", {
      roomId: room.roomId,
      content,
      sender: room.alias,
    });

    setInputValue("");
    inputRef.current?.focus();
  };

  // --- Media Handling ---
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const maxDim = 800;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = (height / width) * maxDim; width = maxDim; }
          else { width = (width / height) * maxDim; height = maxDim; }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const sendMedia = async (file: File, timer?: number) => {
    if (!room) return;
    const isImage = file.type.startsWith("image/") && !file.type.includes("gif");
    const isGif = file.type === "image/gif";
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isGif && !isVideo) return;

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) return;

    let base64: string;
    let mimeType: string;
    let mediaKind: "image" | "gif" | "video";

    if (isImage) { base64 = await compressImage(file); mimeType = "image/jpeg"; mediaKind = "image"; }
    else { base64 = await fileToBase64(file); mimeType = file.type; mediaKind = isGif ? "gif" : "video"; }

    if (base64.length > 6_000_000) return;

    const sendTimer = isVideo ? 0 : (timer || DEFAULT_TIMER);

    // Add to local messages as sent indicator
    setMessages((prev) => [
      ...prev,
      { id: generateId(), content: "", sender: room.alias, timestamp: new Date(), type: "media" as const, mediaKind, viewed: false, mediaData: "__sent__" },
    ]);

    socketRef.current?.emit("room-send-media", {
      roomId: room.roomId,
      sender: room.alias,
      mediaData: base64,
      mimeType,
      mediaKind,
      timer: sendTimer,
    });
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.type.startsWith("video/")) { sendMedia(file, 0); }
    else { setPendingFile(file); setShowTimerPrompt(true); }
  };

  const handleTimerConfirm = (seconds: number) => {
    if (pendingFile) sendMedia(pendingFile, seconds);
    setPendingFile(null);
    setShowTimerPrompt(false);
  };

  const handleViewMedia = (msgId: string, data: string, kind: "image" | "gif" | "video", timer: number) => {
    setViewingMedia(data);
    setViewingMediaId(msgId);
    setViewingMediaKind(kind);
    setViewCountdown(timer > 0 ? timer : null);
    socketRef.current?.emit("room-media-viewed", { roomId: room?.roomId });
  };

  const handleCloseMediaViewer = React.useCallback(() => {
    setMessages((prev) => prev.map((m) => m.id === viewingMediaId ? { ...m, viewed: true, mediaData: undefined } : m));
    setViewingMedia(null);
    setViewingMediaId(null);
    setViewingMediaKind(null);
    setViewCountdown(null);
  }, [viewingMediaId]);

  React.useEffect(() => {
    if (viewCountdown === null) return;
    if (viewCountdown <= 0) { const t = setTimeout(() => handleCloseMediaViewer(), 0); return () => clearTimeout(t); }
    const timeout = setTimeout(() => setViewCountdown((p) => (p !== null ? p - 1 : null)), 1000);
    return () => clearTimeout(timeout);
  }, [viewCountdown, handleCloseMediaViewer]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="font-mono text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4 p-4">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="font-mono text-xl font-bold">Room Not Found</h1>
        <p className="font-mono text-sm text-muted-foreground text-center max-w-sm">
          This room doesn&apos;t exist or hasn&apos;t been saved to your browser.
        </p>
        <Link
          href="/rooms"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 text-white font-mono text-sm rounded-lg cursor-pointer transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Connections
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b py-3 px-4 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/rooms"
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Back to connections"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-[#FF6B2C]">
                STRANGR
              </span>
              <span className="font-mono text-sm text-muted-foreground">/</span>
              <span className="font-mono text-sm font-bold">{room?.roomCode}</span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-muted/50 rounded text-xs font-mono text-muted-foreground">
              <Lock className="h-3 w-3" />
              Private Room
            </span>
            {partnerOnline && (
              <span className="inline-flex items-center gap-1 text-xs font-mono text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                Online
              </span>
            )}
          </div>
          <Button
            variant="outline"
            className="rounded-lg font-mono text-xs cursor-pointer border-[#FF6B2C] text-[#FF6B2C] hover:bg-[#FF6B2C]/10"
          >
            <Video className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Video Call</span>
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-5xl mx-auto w-full px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${
                msg.sender === "system"
                  ? "justify-center"
                  : msg.sender === room?.alias
                    ? "justify-end"
                    : "justify-start"
              }`}
            >
              {msg.sender === "system" ? (
                <p className="font-mono text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg">
                  {msg.content}
                </p>
              ) : msg.type === "media" ? (
                <div className={`rounded-lg px-3 py-2 ${msg.sender === room?.alias ? "bg-[#FF6B2C] text-white" : "bg-muted"}`}>
                  {msg.sender === room?.alias ? (
                    // Sender side
                    <p className={`text-xs font-mono flex items-center gap-1.5 ${msg.mediaData === "__opened__" ? "opacity-70" : ""}`}>
                      <ImageIcon className="h-3.5 w-3.5" />
                      {msg.mediaData === "__opened__" ? "Opened" : (msg.mediaKind === "video" ? "Video" : "Photo")}
                    </p>
                  ) : msg.viewed || !msg.mediaData ? (
                    // Receiver side — already opened
                    <p className="text-xs font-mono text-muted-foreground italic flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5" />
                      Opened
                    </p>
                  ) : (
                    // Receiver side — tap to view
                    <button onClick={() => handleViewMedia(msg.id, msg.mediaData!, msg.mediaKind || "image", msg.timer ?? DEFAULT_TIMER)} className="flex items-center gap-2 cursor-pointer">
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-sm font-mono">{msg.mediaKind === "video" ? "Video" : "Photo"}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-lg ${
                    msg.sender === room?.alias
                      ? "bg-[#FF6B2C] text-white"
                      : "bg-muted"
                  }`}
                >
                  <p className="font-mono text-sm wrap-break-word">{msg.content}</p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t py-3 px-4 shrink-0">
        <form
          onSubmit={handleSend}
          className="max-w-5xl mx-auto flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-10 border bg-background px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-[#FF6B2C] focus:outline-none focus:ring-1 focus:ring-[#FF6B2C]/30 transition-colors duration-200 rounded-lg"
            autoFocus
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaSelect}
            className="hidden"
            aria-hidden="true"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="h-10 w-10 rounded-lg cursor-pointer text-muted-foreground hover:text-[#FF6B2C] hover:border-[#FF6B2C]/50"
            aria-label="Send view-once media"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            type="submit"
            disabled={!inputValue.trim()}
            className="h-10 w-10 rounded-lg bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <MediaViewer
        viewingMedia={viewingMedia}
        viewingMediaKind={viewingMediaKind}
        viewCountdown={viewCountdown}
        onClose={handleCloseMediaViewer}
      />

      <TimerPrompt
        show={showTimerPrompt}
        onConfirm={handleTimerConfirm}
        onCancel={() => { setPendingFile(null); setShowTimerPrompt(false); }}
      />
    </div>
  );
}
