"use client";

import { ArrowRight, Video, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface VideoIdleScreenProps {
  interests: string[];
  interestInput: string;
  onInterestInputChange: (value: string) => void;
  onAddInterest: (e: React.KeyboardEvent) => void;
  onRemoveInterest: (interest: string) => void;
  onStartChat: () => void;
}

export function VideoIdleScreen({
  interests,
  interestInput,
  onInterestInputChange,
  onAddInterest,
  onRemoveInterest,
  onStartChat,
}: VideoIdleScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center"
      >
        <Video className="h-12 w-12 text-[#FF6B2C] mx-auto mb-4" />
        <h1 className="text-2xl font-mono font-bold mb-2">Video Chat</h1>
        <p className="text-sm font-mono text-muted-foreground mb-8">
          Add interests to find people who share your passions, or jump
          straight in for a face-to-face conversation.
        </p>

        {/* Interest Tags Input */}
        <div className="mb-6">
          <label className="block text-left">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
              Interests (optional)
            </span>
            <input
              type="text"
              value={interestInput}
              onChange={(e) => onInterestInputChange(e.target.value)}
              onKeyDown={onAddInterest}
              placeholder="Type an interest and press Enter"
              className="mt-2 block w-full border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-[#FF6B2C] focus:outline-none focus:ring-1 focus:ring-[#FF6B2C]/30 transition-colors duration-200"
            />
          </label>

          {/* Interest Tags */}
          {interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1 px-2 py-1 border font-mono text-xs bg-[#FF6B2C]/5 border-[#FF6B2C]/20 text-foreground"
                >
                  {interest}
                  <button
                    onClick={() => onRemoveInterest(interest)}
                    className="hover:text-[#FF6B2C] transition-colors duration-200 cursor-pointer"
                    aria-label={`Remove ${interest}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={onStartChat}
          size="lg"
          className="w-full rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono cursor-pointer"
        >
          START VIDEO CHAT <ArrowRight className="ml-1 w-4 h-4" />
        </Button>
      </motion.div>
    </div>
  );
}
