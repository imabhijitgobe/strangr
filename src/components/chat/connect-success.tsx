"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, ArrowRight, MessageSquare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConnectSuccessProps {
  roomId: string;
  roomCode: string;
  onGoToRoom: (roomName?: string) => void;
  onContinue: (roomName?: string) => void;
}

export function ConnectSuccess({
  roomId,
  roomCode,
  onGoToRoom,
  onContinue,
}: ConnectSuccessProps) {
  const [copied, setCopied] = React.useState(false);
  const [roomName, setRoomName] = React.useState("");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement("textarea");
      textarea.value = roomCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-sm bg-background border border-border rounded-lg p-6 shadow-xl"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-4xl"
            >
              🎉
            </motion.div>

            <h3 className="font-mono text-lg font-bold">Connected!</h3>
            <p className="font-mono text-sm text-muted-foreground">
              Your private room has been created.
            </p>

            <div className="w-full bg-muted/50 border border-border rounded-lg p-4">
              <p className="font-mono text-xs text-muted-foreground mb-1">
                Room Code
              </p>
              <p className="font-mono text-2xl font-bold text-[#FF6B2C]">
                {roomCode}
              </p>
            </div>

            <p className="font-mono text-xs text-muted-foreground">
              This room is saved in your browser. Bookmark it or save the code
              in case you clear your data.
            </p>

            <div className="w-full">
              <label className="block text-left">
                <span className="font-mono text-xs text-muted-foreground">
                  Name this room (optional)
                </span>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g., Cool person from India"
                  maxLength={30}
                  className="mt-1 block w-full border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-[#FF6B2C] focus:outline-none focus:ring-1 focus:ring-[#FF6B2C]/30 transition-colors duration-200 rounded-lg"
                />
              </label>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <Button
                onClick={() => onGoToRoom(roomName.trim() || undefined)}
                className="w-full rounded-lg bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono cursor-pointer"
              >
                Go to Room <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={handleCopy}
                variant="outline"
                className="w-full rounded-lg font-mono cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Code
                  </>
                )}
              </Button>
              <Button
                onClick={() => onContinue(roomName.trim() || undefined)}
                variant="outline"
                className="w-full rounded-lg font-mono cursor-pointer"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Continue Chatting
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
