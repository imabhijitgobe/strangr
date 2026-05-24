"use client";

import * as React from "react";
import { io, Socket } from "socket.io-client";
import { ChatStatus, SOCKET_URL, countryCodeToFlag } from "@/components/chat/types";
import { ConnectRequest } from "@/components/chat/connect-request";
import { ConnectSuccess } from "@/components/chat/connect-success";
import { saveRoom } from "@/lib/rooms";
import { VideoHeader } from "@/components/video/video-header";
import { VideoControls } from "@/components/video/video-controls";
import { VideoIdleScreen } from "@/components/video/idle-screen";
import { VideoSearchingScreen } from "@/components/video/searching-screen";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function VideoPage() {
  const [status, setStatus] = React.useState<ChatStatus>("idle");
  const [interests, setInterests] = React.useState<string[]>([]);
  const [interestInput, setInterestInput] = React.useState("");
  const [isMicMuted, setIsMicMuted] = React.useState(false);
  const [isCameraMuted, setIsCameraMuted] = React.useState(false);
  const [partnerCountry, setPartnerCountry] = React.useState<{ name: string; flag: string } | null>(null);
  const [connectState, setConnectState] = React.useState<"none" | "sent" | "received">("none");
  const [connectSuccess, setConnectSuccess] = React.useState<{ roomId: string; roomCode: string } | null>(null);
  const connectInitiatorRef = React.useRef(false);

  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);
  const socketRef = React.useRef<Socket | null>(null);
  const peerConnectionRef = React.useRef<RTCPeerConnection | null>(null);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const myCountryRef = React.useRef<{ name: string; flag: string } | null>(null);
  const isInitiatorRef = React.useRef(false);

  // Get local media
  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Camera/mic error:", err);
      alert("Camera and microphone access is required for video chat.");
      return null;
    }
  };

  // Create and configure peer connection
  const createPeerConnection = (): RTCPeerConnection => {
    // Close existing connection if any
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // When we receive remote tracks
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Send ICE candidates to partner
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("webrtc-ice-candidate", {
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        console.log("Peer connection state:", pc.connectionState);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Clean up peer connection
  const closePeerConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  // Socket initialization
  React.useEffect(() => {
    const socket = io(SOCKET_URL || undefined, {
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    // Fetch country
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        if (data.country_name && data.country_code) {
          const flag = countryCodeToFlag(data.country_code);
          myCountryRef.current = { name: data.country_name, flag };
          socket.emit("set-country", { name: data.country_name, flag });
        }
      })
      .catch(() => {});

    // Matched — WE are the initiator (we were waiting in queue)
    socket.on("partner-found", (data: { matchedInterests: string[]; country?: { name: string; flag: string } }) => {
      setStatus("connected");
      setPartnerCountry(data.country || null);
      isInitiatorRef.current = true;

      const pc = createPeerConnection();
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          socket.emit("webrtc-offer", { offer: pc.localDescription });
        })
        .catch((err) => console.error("Offer error:", err));
    });

    // Matched — we are NOT the initiator (we just joined, wait for offer)
    socket.on("partner-found-wait", (data: { matchedInterests: string[]; country?: { name: string; flag: string } }) => {
      setStatus("connected");
      setPartnerCountry(data.country || null);
      isInitiatorRef.current = false;
      // Just wait — the offer will come via webrtc-offer event
    });

    socket.on("waiting", () => {
      setStatus("searching");
    });

    // Receive offer — we are NOT the initiator
    socket.on("webrtc-offer", async (data: { offer: RTCSessionDescriptionInit }) => {
      isInitiatorRef.current = false;
      setStatus("connected");

      const pc = createPeerConnection();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { answer: pc.localDescription });
      } catch (err) {
        console.error("Answer error:", err);
      }
    });

    // Receive answer — we ARE the initiator
    socket.on("webrtc-answer", async (data: { answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      // Only set remote description if we're in the right state
      if (pc.signalingState === "have-local-offer") {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (err) {
          console.error("Set answer error:", err);
        }
      }
    });

    // Receive ICE candidate
    socket.on("webrtc-ice-candidate", async (data: { candidate: RTCIceCandidateInit }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error("ICE error:", err);
      }
    });

    // Partner disconnected
    socket.on("partner-disconnected", () => {
      closePeerConnection();
      setStatus("disconnected");
      setPartnerCountry(null);
      setConnectState("none");
    });

    // Connect request flow
    socket.on("connect-request-received", () => {
      setConnectState("received");
    });

    socket.on("connect-accepted", (data: { roomId: string; roomCode: string }) => {
      setConnectState("none");
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
      closePeerConnection();
      stopLocalStream();
    };
  }, []);

  // --- Handlers ---

  const handleStartChat = async () => {
    const stream = await getLocalStream();
    if (!stream) return;
    setStatus("searching");
    socketRef.current?.emit("find-partner", { interests, country: myCountryRef.current });
  };

  const handleCancelSearch = () => {
    socketRef.current?.emit("cancel-search");
    stopLocalStream();
    setStatus("idle");
  };

  const handleToggleMic = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMicMuted(!track.enabled);
      }
    }
  };

  const handleToggleCamera = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsCameraMuted(!track.enabled);
      }
    }
  };

  const handleNext = async () => {
    socketRef.current?.emit("disconnect-chat");
    closePeerConnection();
    setPartnerCountry(null);
    setConnectState("none");
    setConnectSuccess(null);
    setStatus("searching");
    // Re-get stream if it was stopped
    if (!localStreamRef.current) {
      await getLocalStream();
    }
    socketRef.current?.emit("find-partner", { interests, country: myCountryRef.current });
  };

  const handleEndCall = () => {
    socketRef.current?.emit("disconnect-chat");
    closePeerConnection();
    stopLocalStream();
    setPartnerCountry(null);
    setConnectState("none");
    setConnectSuccess(null);
    setStatus("idle");
  };

  const handleAddInterest = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && interestInput.trim()) {
      e.preventDefault();
      const tag = interestInput.trim().toLowerCase();
      if (!interests.includes(tag)) setInterests((prev) => [...prev, tag]);
      setInterestInput("");
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests((prev) => prev.filter((i) => i !== interest));
  };

  const handleConnect = () => {
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

  // --- Render ---

  if (status === "idle") {
    return (
      <div className="flex flex-col h-screen bg-background">
        <VideoIdleScreen
          interests={interests}
          interestInput={interestInput}
          onInterestInputChange={setInterestInput}
          onAddInterest={handleAddInterest}
          onRemoveInterest={handleRemoveInterest}
          onStartChat={handleStartChat}
        />
      </div>
    );
  }

  if (status === "searching") {
    return (
      <div className="flex flex-col h-screen bg-background">
        <VideoSearchingScreen onCancel={handleCancelSearch} />
        <div className="fixed bottom-8 right-8 w-36 h-48 rounded-lg overflow-hidden border-2 border-[#FF6B2C]/30 shadow-lg bg-zinc-800 z-50">
          <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      <VideoHeader status={status} partnerCountry={partnerCountry} />

      {/* Remote video */}
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
        <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
        {status === "disconnected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
            <p className="font-mono text-sm text-white/60 mb-4">Stranger has disconnected.</p>
            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-lg bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono text-sm text-white font-medium transition-colors duration-200 cursor-pointer"
            >
              FIND NEXT
            </button>
          </div>
        )}
      </div>

      {/* Local video PiP */}
      <div className="absolute bottom-24 right-4 z-10 w-36 h-48 sm:w-44 sm:h-56 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg bg-zinc-800">
        <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        {isCameraMuted && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
            <span className="font-mono text-xs text-white/50">Camera off</span>
          </div>
        )}
      </div>

      {status === "connected" && (
        <VideoControls
          isMicMuted={isMicMuted}
          isCameraMuted={isCameraMuted}
          onToggleMic={handleToggleMic}
          onToggleCamera={handleToggleCamera}
          onNext={handleNext}
          onEndCall={handleEndCall}
          onConnect={handleConnect}
        />
      )}

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
            if (roomName && connectSuccess) {
              const rooms = JSON.parse(localStorage.getItem("strangr_rooms") || "[]");
              const idx = rooms.findIndex((r: any) => r.roomId === connectSuccess.roomId);
              if (idx >= 0) { rooms[idx].roomName = roomName; localStorage.setItem("strangr_rooms", JSON.stringify(rooms)); }
            }
            window.location.href = `/room/${connectSuccess.roomId}`;
          }}
          onContinue={(roomName) => {
            if (roomName && connectSuccess) {
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
