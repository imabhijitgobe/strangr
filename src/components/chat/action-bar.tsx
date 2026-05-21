"use client";

import { ArrowRight, ImageIcon, Send, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatStatus } from "@/components/chat/types";

interface ActionBarProps {
  status: ChatStatus;
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onDisconnect: () => void;
  onNewChat: () => void;
  onBackToHome: () => void;
  onMediaSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  partnerCountry?: { name: string; flag: string } | null;
}

export function ActionBar({
  status,
  inputValue,
  onInputChange,
  onSendMessage,
  onDisconnect,
  onNewChat,
  onBackToHome,
  onMediaSelect,
  fileInputRef,
  inputRef,
  partnerCountry,
}: ActionBarProps) {
  return (
    <div className="border-t py-2 shrink-0">
      {status === "connected" ? (
        <form
          onSubmit={onSendMessage}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={onInputChange}
            placeholder="Type a message..."
            className="flex-1 h-10 border bg-background px-3 py-0 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-[#FF6B2C] focus:outline-none focus:ring-1 focus:ring-[#FF6B2C]/30 transition-colors duration-200"
            autoFocus
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={onMediaSelect}
            className="hidden"
            aria-hidden="true"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="h-10 w-10 rounded-none cursor-pointer text-muted-foreground hover:text-[#FF6B2C] hover:border-[#FF6B2C]/50"
            aria-label="Send view-once media"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            type="submit"
            disabled={!inputValue.trim()}
            className="h-10 w-10 rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={onDisconnect}
            variant="outline"
            className="h-10 rounded-none font-mono text-xs cursor-pointer border-destructive text-destructive hover:bg-destructive/10"
            aria-label="Disconnect from chat (Esc)"
          >
            <SkipForward className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">NEXT</span>
          </Button>
          {partnerCountry && (
            <span
              className="h-10 w-10 flex items-center justify-center text-lg"
              title={partnerCountry.name}
              aria-label={`Partner from ${partnerCountry.name}`}
            >
              {partnerCountry.flag}
            </span>
          )}
        </form>
      ) : (
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={onNewChat}
            className="rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono cursor-pointer"
          >
            NEW CHAT <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
          <Button
            onClick={onBackToHome}
            variant="outline"
            className="rounded-none font-mono cursor-pointer"
          >
            BACK TO HOME
          </Button>
        </div>
      )}
    </div>
  );
}
