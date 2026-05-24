"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConnectRequestProps {
  type: "sent" | "received";
  onAccept?: () => void;
  onDecline?: () => void;
  onClose: () => void;
}

export function ConnectRequest({
  type,
  onAccept,
  onDecline,
  onClose,
}: ConnectRequestProps) {
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
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[#FF6B2C]/10 flex items-center justify-center">
              <Link2 className="h-6 w-6 text-[#FF6B2C]" />
            </div>

            {type === "sent" ? (
              <>
                <h3 className="font-mono text-lg font-bold">
                  Request Sent
                </h3>
                <p className="font-mono text-sm text-muted-foreground">
                  Waiting for stranger to accept your connection request...
                </p>
                <Loader2 className="h-5 w-5 animate-spin text-[#FF6B2C]" />
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full rounded-lg font-mono cursor-pointer"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <h3 className="font-mono text-lg font-bold">
                  Connection Request
                </h3>
                <p className="font-mono text-sm text-muted-foreground">
                  Stranger wants to stay connected with you. If you accept,
                  you&apos;ll both get a private room to chat anytime.
                </p>
                <div className="flex gap-3 w-full">
                  <Button
                    onClick={onDecline}
                    variant="outline"
                    className="flex-1 rounded-lg font-mono cursor-pointer"
                  >
                    Decline
                  </Button>
                  <Button
                    onClick={onAccept}
                    className="flex-1 rounded-lg bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono cursor-pointer"
                  >
                    Accept
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
