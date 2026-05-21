"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface TimerPromptProps {
  show: boolean;
  onConfirm: (seconds: number) => void;
  onCancel: () => void;
}

export function TimerPrompt({ show, onConfirm, onCancel }: TimerPromptProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 bg-black/60 flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-background border p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-mono font-bold text-lg mb-2">
              View-Once Timer
            </h3>
            <p className="font-mono text-xs text-muted-foreground mb-4">
              How long can the receiver view this?
            </p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[3, 5, 10, 15, 30].map((sec) => (
                <button
                  key={sec}
                  onClick={() => onConfirm(sec)}
                  className="h-10 border font-mono text-sm hover:bg-[#FF6B2C] hover:text-white hover:border-[#FF6B2C] transition-colors duration-200 cursor-pointer"
                >
                  {sec}s
                </button>
              ))}
            </div>
            <Button
              onClick={onCancel}
              variant="ghost"
              className="w-full font-mono text-xs cursor-pointer"
            >
              Cancel
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
