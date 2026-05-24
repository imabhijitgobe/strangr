"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, Clock, Copy, Pencil, Trash2, Check, X } from "lucide-react";
import { SavedRoom } from "@/lib/rooms";

interface RoomCardProps {
  room: SavedRoom;
  onDelete: (roomId: string) => void;
  onRename: (roomId: string, newName: string) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLastActive(dateStr: string | null): string {
  if (!dateStr) return "Never visited";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function RoomCard({ room, onDelete, onRename }: RoomCardProps) {
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(room.roomName || "");
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(room.roomCode);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = room.roomCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRenameValue(room.roomName || "");
    setIsRenaming(true);
  };

  const handleRenameConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRename(room.roomId, renameValue.trim());
    setIsRenaming(false);
  };

  const handleRenameCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRenaming(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Remove this room from your list?")) {
      onDelete(room.roomId);
    }
  };

  return (
    <Link href={`/room/${room.roomId}`} className="block">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="border border-border rounded-lg p-4 bg-background hover:shadow-lg hover:border-[#FF6B2C]/50 transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#FF6B2C]/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-[#FF6B2C]" />
            </div>
            <div>
              {isRenaming ? (
                <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onRename(room.roomId, renameValue.trim()); setIsRenaming(false); } if (e.key === "Escape") setIsRenaming(false); }}
                    maxLength={30}
                    className="border bg-background px-2 py-0.5 font-mono text-sm text-foreground focus:border-[#FF6B2C] focus:outline-none rounded w-40"
                    autoFocus
                  />
                  <button onClick={handleRenameConfirm} className="p-0.5 text-green-500 hover:text-green-600 cursor-pointer">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={handleRenameCancel} className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="font-mono text-base font-bold">{room.roomName || room.roomCode}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {room.roomName ? room.roomCode : room.alias}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-muted-foreground">
              Created: {formatDate(room.createdAt)}
            </p>
            <div className="flex items-center gap-1 justify-end mt-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <p className="font-mono text-xs text-muted-foreground">
                {formatLastActive(room.lastVisitedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground rounded hover:bg-muted/50 transition-colors cursor-pointer"
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy code"}
          </button>
          <button
            onClick={handleRenameClick}
            className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground rounded hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <Pencil className="h-3 w-3" />
            Rename
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10 transition-colors cursor-pointer ml-auto"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      </motion.div>
    </Link>
  );
}
