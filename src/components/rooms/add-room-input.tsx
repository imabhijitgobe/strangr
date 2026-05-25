"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveRoom, generateRoomCode, getSavedRooms } from "@/lib/rooms";
import { generateId } from "@/components/chat/types";

interface AddRoomInputProps {
  onRoomAdded: () => void;
}

export function AddRoomInput({ onRoomAdded }: AddRoomInputProps) {
  const [code, setCode] = React.useState("");
  const [alias, setAlias] = React.useState("");
  const [error, setError] = React.useState("");

  const validateCode = (value: string): boolean => {
    // Format: 4 uppercase letters + 2 digits (e.g., WOLF42)
    return /^[A-Z]{4}\d{2}$/.test(value.toUpperCase());
  };

  const handleAdd = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter a room code");
      return;
    }
    if (!validateCode(trimmed)) {
      setError("Invalid format. Use 4 letters + 2 digits (e.g., WOLF42)");
      return;
    }

    // Check if already exists
    const rooms = getSavedRooms();
    if (rooms.some((r) => r.roomCode === trimmed)) {
      setError("This room is already saved");
      return;
    }

    saveRoom({
      roomId: generateId(),
      roomCode: trimmed,
      alias: alias.trim() || "Person",
      createdAt: new Date().toISOString(),
      lastVisitedAt: null,
    });

    setCode("");
    setAlias("");
    setError("");
    onRoomAdded();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <p className="font-mono text-xs text-muted-foreground">
        Have a room code? Enter it to add a room
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError("");
          }}
          onKeyDown={handleKeyDown}
          placeholder="e.g., WOLF42"
          maxLength={6}
          className="flex-1 h-10 border bg-background px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-[#FF6B2C] focus:outline-none focus:ring-1 focus:ring-[#FF6B2C]/30 transition-colors duration-200 rounded-lg"
        />
        <input
          type="text"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="Your name in this room"
          maxLength={20}
          className="flex-1 h-10 border bg-background px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-[#FF6B2C] focus:outline-none focus:ring-1 focus:ring-[#FF6B2C]/30 transition-colors duration-200 rounded-lg"
        />
        <Button
          onClick={handleAdd}
          className="h-10 rounded-lg bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
      {error && (
        <p className="font-mono text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
