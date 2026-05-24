"use client";

import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  SkipForward,
  PhoneOff,
  Link2,
} from "lucide-react";

interface VideoControlsProps {
  isMicMuted: boolean;
  isCameraMuted: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onNext: () => void;
  onEndCall: () => void;
  onConnect?: () => void;
}

export function VideoControls({
  isMicMuted,
  isCameraMuted,
  onToggleMic,
  onToggleCamera,
  onNext,
  onEndCall,
  onConnect,
}: VideoControlsProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 px-4 py-4 bg-black/40 backdrop-blur-sm">
      <div className="flex items-center justify-center gap-4">
        {/* Toggle Mic */}
        <button
          onClick={onToggleMic}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-200 cursor-pointer ${
            isMicMuted
              ? "bg-red-500/80 hover:bg-red-500"
              : "bg-white/20 hover:bg-white/30"
          }`}
          aria-label={isMicMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {isMicMuted ? (
            <MicOff className="h-5 w-5 text-white" />
          ) : (
            <Mic className="h-5 w-5 text-white" />
          )}
        </button>

        {/* Toggle Camera */}
        <button
          onClick={onToggleCamera}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-200 cursor-pointer ${
            isCameraMuted
              ? "bg-red-500/80 hover:bg-red-500"
              : "bg-white/20 hover:bg-white/30"
          }`}
          aria-label={isCameraMuted ? "Turn on camera" : "Turn off camera"}
        >
          {isCameraMuted ? (
            <CameraOff className="h-5 w-5 text-white" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </button>

        {/* Connect */}
        {onConnect && (
          <button
            onClick={onConnect}
            className="h-12 px-5 rounded-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 transition-colors duration-200 cursor-pointer"
            aria-label="Send connection request"
          >
            <Link2 className="h-5 w-5 text-white" />
            <span className="font-mono text-sm text-white font-medium hidden sm:inline">CONNECT</span>
          </button>
        )}

        {/* Next / Skip */}
        <button
          onClick={onNext}
          className="h-12 px-5 rounded-full flex items-center justify-center gap-2 bg-[#FF6B2C]/80 hover:bg-[#FF6B2C] transition-colors duration-200 cursor-pointer"
          aria-label="Skip to next person"
        >
          <SkipForward className="h-5 w-5 text-white" />
          <span className="font-mono text-sm text-white font-medium">
            NEXT
          </span>
        </button>

        {/* End Call */}
        <button
          onClick={onEndCall}
          className="h-12 px-5 rounded-full flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-600 transition-colors duration-200 cursor-pointer"
          aria-label="End call"
        >
          <PhoneOff className="h-5 w-5 text-white" />
          <span className="font-mono text-sm text-white font-medium">END</span>
        </button>
      </div>
    </div>
  );
}
