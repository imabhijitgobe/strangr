"use client";

import * as React from "react";
import { AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";

import {
  ChatStatus,
  Message,
  SOCKET_URL,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  DEFAULT_TIMER,
  countryCodeToFlag,
  generateId,
} from "@/components/chat/types";
import { ChatHeader } from "@/components/chat/chat-header";
import { IdleScreen } from "@/components/chat/idle-screen";
import { SearchingScreen } from "@/components/chat/searching-screen";
import { MessageBubble } from "@/components/chat/message-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ActionBar } from "@/components/chat/action-bar";
import { MediaViewer } from "@/components/chat/media-viewer";
import { TimerPrompt } from "@/components/chat/timer-prompt";
import { ConnectRequest } from "@/components/chat/connect-request";
import { ConnectSuccess } from "@/components/chat/connect-success";
import { saveRoom } from "@/lib/rooms";

export default function ChatPage() {
  const [status, setStatus] = React.useState<ChatStatus>("idle");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [interests, setInterests] = React.useState<string[]>([]);
  const [interestInput, setInterestInput] = React.useState("");
  const [isPartnerTyping, setIsPartnerTyping] = React.useState(false);
  const [viewingMedia, setViewingMedia] = React.useState<string | null>(null);
  const [viewingMediaId, setViewingMediaId] = React.useState<string | null>(null);
  const [viewingMediaKind, setViewingMediaKind] = React.useState<"image" | "gif" | "video" | null>(null);
  const [viewCountdown, setViewCountdown] = React.useState<number | null>(null);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [showTimerPrompt, setShowTimerPrompt] = React.useState(false);
  const [partnerCountry, setPartnerCountry] = React.useState<{ name: string; flag: string } | null>(null);
  const [connectState, setConnectState] = React.useState<"none" | "sent" | "received">("none");
  const [connectSuccess, setConnectSuccess] = React.useState<{ roomId: string; roomCode: string } | null>(null);

  const socketRef = React.useRef<Socket | null>(null);
  const statusRef = React.useRef<ChatStatus>(status);
  const interestsRef = React.useRef<string[]>(interests);
  const myCountryRef = React.useRef<{ name: string; flag: string } | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const connectInitiatorRef = React.useRef<boolean>(false);

  // Keep refs in sync
  React.useEffect(() => {
    statusRef.current = status;
  }, [status]);

  React.useEffect(() => {
    interestsRef.current = interests;
  }, [interests]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping]);

  // Initialize socket connection
  React.useEffect(() => {
    const socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
    });

    // Fetch user's country on connect
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data.country_name && data.country_code) {
          const flag = countryCodeToFlag(data.country_code);
          const country = { name: data.country_name, flag };
          myCountryRef.current = country;
          socket.emit("set-country", country);
        }
      })
      .catch(() => {});

    // Partner found
    socket.on("partner-found", (data: { matchedInterests: string[]; country?: { name: string; flag: string } }) => {
      setStatus("connected");
      setPartnerCountry(data.country || null);
      const matchMsg =
        data.matchedInterests.length > 0
          ? `You're now chatting with a random stranger. You both like: ${data.matchedInterests.join(", ")}`
          : "You're now chatting with a random stranger. Say hi!";

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          content: matchMsg,
          sender: "system",
          timestamp: new Date(),
        },
      ]);
      inputRef.current?.focus();
    });

    // Same handler for the non-initiator side
    socket.on("partner-found-wait", (data: { matchedInterests: string[]; country?: { name: string; flag: string } }) => {
      setStatus("connected");
      setPartnerCountry(data.country || null);
      const matchMsg =
        data.matchedInterests.length > 0
          ? `You're now chatting with a random stranger. You both like: ${data.matchedInterests.join(", ")}`
          : "You're now chatting with a random stranger. Say hi!";

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          content: matchMsg,
          sender: "system",
          timestamp: new Date(),
        },
      ]);
      inputRef.current?.focus();
    });

    // Waiting in queue
    socket.on("waiting", () => {
      setStatus("searching");
    });

    // Receive message from partner
    socket.on(
      "receive-message",
      (data: { content: string; timestamp: string }) => {
        setIsPartnerTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            content: data.content,
            sender: "stranger",
            timestamp: new Date(data.timestamp),
            type: "text",
          },
        ]);
      }
    );

    // Receive view-once media from partner
    socket.on(
      "receive-image",
      (data: { data: string; mimeType: string; timestamp: string; timer?: number; mediaKind?: string }) => {
        setIsPartnerTyping(false);
        const kind = (data.mediaKind || "image") as "image" | "gif" | "video";
        const label = kind === "video" ? "video" : kind === "gif" ? "GIF" : "photo";
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            content: `View-once ${label}`,
            sender: "stranger",
            timestamp: new Date(data.timestamp),
            type: "media",
            mediaData: data.data,
            mediaMimeType: data.mimeType,
            mediaKind: kind,
            timer: data.timer ?? DEFAULT_TIMER,
            viewed: false,
          },
        ]);
      }
    );

    // Confirmation that media was sent
    socket.on("image-sent", (data: { timestamp: string; mediaKind?: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          content: "",
          sender: "you",
          timestamp: new Date(data.timestamp),
          type: "media-sent",
          mediaKind: (data.mediaKind || "image") as "image" | "gif" | "video",
          viewed: false,
        },
      ]);
    });

    // Sender gets notified when partner viewed their media — mark bubble as "Opened"
    socket.on("partner-viewed-media", () => {
      setMessages((prev) => {
        // Find the last unviewed media-sent message and mark it as viewed
        const lastIdx = [...prev].reverse().findIndex(
          (m) => m.type === "media-sent" && !m.viewed
        );
        if (lastIdx === -1) return prev;
        const actualIdx = prev.length - 1 - lastIdx;
        return prev.map((m, i) =>
          i === actualIdx ? { ...m, viewed: true } : m
        );
      });
    });

    // Partner is typing
    socket.on("partner-typing", () => {
      setIsPartnerTyping(true);
    });

    // Partner stopped typing
    socket.on("partner-stop-typing", () => {
      setIsPartnerTyping(false);
    });

    // Partner disconnected
    socket.on("partner-disconnected", (data?: { reason?: string }) => {
      setStatus("disconnected");
      setIsPartnerTyping(false);
      setConnectState("none");

      const reason = data?.reason;
      const msg =
        reason === "left"
          ? "Stranger has left the chat (closed the tab)."
          : "Stranger has disconnected.";

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          content: msg,
          sender: "system",
          timestamp: new Date(),
        },
      ]);
    });

    // Partner switched away (opened another tab/app)
    socket.on("partner-away", () => {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          content: "Stranger has switched to another tab.",
          sender: "system",
          timestamp: new Date(),
        },
      ]);
    });

    // Partner came back
    socket.on("partner-back", () => {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          content: "Stranger is back.",
          sender: "system",
          timestamp: new Date(),
        },
      ]);
    });

    // --- Connection Request Flow ---
    socket.on("connect-request-received", () => {
      setConnectState("received");
    });

    socket.on("connect-accepted", (data: { roomId: string; roomCode: string }) => {
      setConnectState("none");
      // Check if room already exists (same browser / same user in two tabs)
      const existingRooms = JSON.parse(localStorage.getItem("strangr_rooms") || "[]");
      if (existingRooms.some((r: any) => r.roomId === data.roomId)) {
        // Room already saved by the other tab — don't show success, just notify
        setMessages((prev) => [
          ...prev,
          { id: generateId(), content: "You're already connected with this person!", sender: "system", timestamp: new Date() },
        ]);
        return;
      }
      setConnectSuccess(data);
      saveRoom({
        roomId: data.roomId,
        roomCode: data.roomCode,
        alias: connectInitiatorRef.current ? "Person 1" : "Person 2",
        createdAt: new Date().toISOString(),
        lastVisitedAt: null,
      });
    });

    socket.on("connect-declined", () => {
      setConnectState("none");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Notify server on tab close / navigation away
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      socketRef.current?.emit("disconnect-chat");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // ESC key: disconnect if connected, new chat if disconnected
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (statusRef.current === "connected") {
          socketRef.current?.emit("disconnect-chat");
          setStatus("disconnected");
          setIsPartnerTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              content: "You have disconnected.",
              sender: "system",
              timestamp: new Date(),
            },
          ]);
        } else if (statusRef.current === "disconnected") {
          setStatus("searching");
          setMessages([
            {
              id: generateId(),
              content: "Looking for someone to chat with...",
              sender: "system",
              timestamp: new Date(),
            },
          ]);
          setIsPartnerTyping(false);
          socketRef.current?.emit("find-partner", { interests: interestsRef.current, country: myCountryRef.current });
        } else if (statusRef.current === "searching") {
          socketRef.current?.emit("cancel-search");
          setStatus("idle");
          setMessages([]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Detect when user switches tab / minimizes / opens another app
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && statusRef.current === "connected") {
        socketRef.current?.emit("user-away");
      } else if (!document.hidden && statusRef.current === "connected") {
        socketRef.current?.emit("user-back");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // --- Handlers ---

  const handleStartChat = () => {
    setStatus("searching");
    setMessages([
      {
        id: generateId(),
        content: "Looking for someone to chat with...",
        sender: "system",
        timestamp: new Date(),
      },
    ]);
    setIsPartnerTyping(false);
    setConnectState("none");
    setConnectSuccess(null);
    connectInitiatorRef.current = false;
    socketRef.current?.emit("find-partner", { interests, country: myCountryRef.current });
  };

  const handleDisconnect = () => {
    socketRef.current?.emit("disconnect-chat");
    setStatus("disconnected");
    setIsPartnerTyping(false);
    setPartnerCountry(null);
    setConnectState("none");
    setConnectSuccess(null);
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        content: "You have disconnected.",
        sender: "system",
        timestamp: new Date(),
      },
    ]);
  };

  const handleNewChat = () => {
    handleStartChat();
  };

  const handleCancelSearch = () => {
    socketRef.current?.emit("cancel-search");
    setStatus("idle");
    setMessages([]);
  };

  const handleConnect = () => {
    // Check if connecting from same browser (same localStorage = same user)
    // This prevents creating a room with yourself in two tabs
    const rooms = JSON.parse(localStorage.getItem("strangr_rooms") || "[]");
    // We can't truly detect "same partner" without auth, but we can warn
    connectInitiatorRef.current = true;
    socketRef.current?.emit("connect-request");
    setConnectState("sent");
  };

  const handleAcceptConnect = () => {
    socketRef.current?.emit("connect-accept");
  };

  const handleDeclineConnect = () => {
    socketRef.current?.emit("connect-decline");
    setConnectState("none");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || status !== "connected") return;

    const content = inputValue.trim();

    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        content,
        sender: "you",
        timestamp: new Date(),
        type: "text",
      },
    ]);

    socketRef.current?.emit("send-message", { content });
    socketRef.current?.emit("stop-typing");
    setInputValue("");
  };

  // Send media (image, gif, video)
  const sendMedia = async (file: File, timer?: number) => {
    const isImage = file.type.startsWith("image/") && !file.type.includes("gif");
    const isGif = file.type === "image/gif";
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isGif && !isVideo) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          content: "Unsupported file type. Send images, GIFs, or videos.",
          sender: "system",
          timestamp: new Date(),
          type: "system",
        },
      ]);
      return;
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      const limitLabel = isVideo ? "5MB" : "1MB";
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          content: `File too large. Max ${limitLabel} for ${isVideo ? "videos" : "images/GIFs"}.`,
          sender: "system",
          timestamp: new Date(),
          type: "system",
        },
      ]);
      return;
    }

    let base64: string;
    let mimeType: string;
    let mediaKind: "image" | "gif" | "video";

    if (isImage) {
      base64 = await compressImage(file);
      mimeType = "image/jpeg";
      mediaKind = "image";
    } else {
      base64 = await fileToBase64(file);
      mimeType = file.type;
      mediaKind = isGif ? "gif" : "video";
    }

    if (base64.length > 6_000_000) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          content: "File too large after encoding. Try a smaller file.",
          sender: "system",
          timestamp: new Date(),
          type: "system",
        },
      ]);
      return;
    }

    const sendTimer = isVideo ? 0 : (timer || DEFAULT_TIMER);

    socketRef.current?.emit("send-image", {
      data: base64,
      mimeType,
      timer: sendTimer,
      mediaKind,
    });
  };

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
          if (width > height) {
            height = (height / width) * maxDim;
            width = maxDim;
          } else {
            width = (width / height) * maxDim;
            height = maxDim;
          }
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

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const isVideo = file.type.startsWith("video/");

    if (isVideo) {
      sendMedia(file, 0);
    } else {
      setPendingFile(file);
      setShowTimerPrompt(true);
    }
  };

  const handleTimerConfirm = (seconds: number) => {
    if (pendingFile) {
      sendMedia(pendingFile, seconds);
    }
    setPendingFile(null);
    setShowTimerPrompt(false);
  };

  const handleTimerCancel = () => {
    setPendingFile(null);
    setShowTimerPrompt(false);
  };

  const handleViewMedia = (
    messageId: string,
    mediaData: string,
    mediaKind: "image" | "gif" | "video",
    timer: number
  ) => {
    setViewingMedia(mediaData);
    setViewingMediaId(messageId);
    setViewingMediaKind(mediaKind);
    setViewCountdown(timer > 0 ? timer : null);
    socketRef.current?.emit("media-viewed");
  };

  const handleCloseMediaViewer = React.useCallback(() => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === viewingMediaId
          ? { ...msg, viewed: true, mediaData: undefined }
          : msg
      )
    );
    setViewingMedia(null);
    setViewingMediaId(null);
    setViewingMediaKind(null);
    setViewCountdown(null);
  }, [viewingMediaId]);

  // Auto-close countdown timer
  React.useEffect(() => {
    if (viewCountdown === null) return;
    if (viewCountdown <= 0) {
      const t = setTimeout(() => handleCloseMediaViewer(), 0);
      return () => clearTimeout(t);
    }

    const timeout = setTimeout(() => {
      setViewCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [viewCountdown, handleCloseMediaViewer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    socketRef.current?.emit("typing");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stop-typing");
    }, 1500);
  };

  const handleAddInterest = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && interestInput.trim()) {
      e.preventDefault();
      const tag = interestInput.trim().toLowerCase();
      if (!interests.includes(tag)) {
        setInterests((prev) => [...prev, tag]);
      }
      setInterestInput("");
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests((prev) => prev.filter((i) => i !== interest));
  };

  const handleBackToHome = () => {
    setStatus("idle");
    setMessages([]);
  };

  // --- Render ---

  
  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader status={status} partnerCountry={partnerCountry} />

      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full overflow-hidden px-4">
        {status === "idle" && (
          <IdleScreen
            interests={interests}
            interestInput={interestInput}
            onInterestInputChange={setInterestInput}
            onAddInterest={handleAddInterest}
            onRemoveInterest={handleRemoveInterest}
            onStartChat={handleStartChat}
          />
        )}

        {status === "searching" && (
          <SearchingScreen onCancel={handleCancelSearch} />
        )}

        {(status === "connected" || status === "disconnected") && (
          <>
          
            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onViewMedia={handleViewMedia}
                  />
                ))}
              </AnimatePresence>

              {isPartnerTyping && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </div>

            {/* Action Bar */}
            <ActionBar
              status={status}
              inputValue={inputValue}
              onInputChange={handleInputChange}
              onSendMessage={handleSendMessage}
              onDisconnect={handleDisconnect}
              onNewChat={handleNewChat}
              onBackToHome={handleBackToHome}
              onMediaSelect={handleMediaSelect}
              fileInputRef={fileInputRef}
              inputRef={inputRef}
              partnerCountry={partnerCountry}
              onConnect={handleConnect}
            />
          </>
        )}
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
        onCancel={handleTimerCancel}
      />

      {connectState !== "none" && (
        <ConnectRequest
          type={connectState}
          onAccept={handleAcceptConnect}
          onDecline={handleDeclineConnect}
          onClose={() => setConnectState("none")}
        />
      )}

      {connectSuccess && (
        <ConnectSuccess
          roomId={connectSuccess.roomId}
          roomCode={connectSuccess.roomCode}
          onGoToRoom={(roomName) => {
            if (roomName) {
              const rooms = JSON.parse(localStorage.getItem("strangr_rooms") || "[]");
              const idx = rooms.findIndex((r: any) => r.roomId === connectSuccess.roomId);
              if (idx >= 0) { rooms[idx].roomName = roomName; localStorage.setItem("strangr_rooms", JSON.stringify(rooms)); }
            }
            window.location.href = `/room/${connectSuccess.roomId}`;
          }}
          onContinue={(roomName) => {
            if (roomName) {
              const rooms = JSON.parse(localStorage.getItem("strangr_rooms") || "[]");
              const idx = rooms.findIndex((r: any) => r.roomId === connectSuccess.roomId);
              if (idx >= 0) { rooms[idx].roomName = roomName; localStorage.setItem("strangr_rooms", JSON.stringify(rooms)); }
            }
            setConnectSuccess(null);
          }}
        />
      )}
    </div>
  );
}
