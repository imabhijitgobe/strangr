"use client";

import { ImageIcon, Video, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Message, DEFAULT_TIMER } from "@/components/chat/types";

interface MessageBubbleProps {
  message: Message;
  onViewMedia: (
    messageId: string,
    mediaData: string,
    mediaKind: "image" | "gif" | "video",
    timer: number
  ) => void;
}

export function MessageBubble({ message, onViewMedia }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${
        message.sender === "you"
          ? "justify-end"
          : message.sender === "system"
            ? "justify-center"
            : "justify-start"
      }`}
    >
      {message.sender === "system" ? (
        <div className="px-3 py-1 max-w-[85%]">
          <p className="text-[11px] font-mono text-muted-foreground text-center">
            {message.content}
          </p>
        </div>
      ) : message.type === "media" ? (
        // View-once media (receiver side)
        <div className={`rounded-lg px-3 py-2 ${
          message.viewed ? "bg-muted" : "bg-muted"
        }`}>
          {message.viewed || !message.mediaData ? (
            <p className="text-xs font-mono text-muted-foreground italic flex items-center gap-1.5">
              {message.mediaKind === "video" ? (
                <Video className="h-3.5 w-3.5" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
              )}
              Opened
            </p>
          ) : (
            <button
              onClick={() =>
                onViewMedia(
                  message.id,
                  message.mediaData!,
                  message.mediaKind || "image",
                  message.timer ?? DEFAULT_TIMER
                )
              }
              className="flex items-center gap-2 cursor-pointer"
              aria-label={`View ${message.mediaKind || "photo"}`}
            >
              <Eye className="h-4 w-4 text-[#FF6B2C]" />
              <span className="text-sm font-mono">
                {message.mediaKind === "video" ? "Video" : message.mediaKind === "gif" ? "GIF" : "Photo"}
              </span>
            </button>
          )}
        </div>
      ) : message.type === "media-sent" ? (
        // View-once media (sender side)
        <div className="rounded-lg px-3 py-2 bg-[#FF6B2C] text-white">
          {message.viewed ? (
            <p className="text-xs font-mono flex items-center gap-1.5 opacity-70">
              {message.mediaKind === "video" ? (
                <Video className="h-3.5 w-3.5" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
              )}
              Opened
            </p>
          ) : (
            <p className="text-xs font-mono flex items-center gap-1.5">
              {message.mediaKind === "video" ? (
                <Video className="h-3.5 w-3.5" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
              )}
              {message.mediaKind === "video" ? "Video" : message.mediaKind === "gif" ? "GIF" : "Photo"}
            </p>
          )}
        </div>
      ) : (
        // Regular text message
        <div className={`max-w-[75%] px-2.5 py-1.5 rounded-lg ${
          message.sender === "you"
            ? "bg-[#FF6B2C] text-white"
            : "bg-muted text-foreground"
        }`}>
          <p className="text-sm font-mono">
            {message.content}
          </p>
        </div>
      )}
    </motion.div>
  );
}
