"use client";

import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface VideoSearchingScreenProps {
  onCancel: () => void;
}

export function VideoSearchingScreen({ onCancel }: VideoSearchingScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <Loader2 className="h-10 w-10 text-[#FF6B2C] mx-auto mb-4 animate-spin" />
        <p className="font-mono text-sm text-muted-foreground">
          Looking for someone to video chat with...
        </p>
        <Button
          onClick={onCancel}
          variant="ghost"
          className="mt-4 font-mono text-xs cursor-pointer"
        >
          Cancel
        </Button>
      </motion.div>
    </div>
  );
}
