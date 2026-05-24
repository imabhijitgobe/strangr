"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, MessageSquare } from "lucide-react";
import { getSavedRooms, saveRoom, removeRoom, SavedRoom } from "@/lib/rooms";
import { RoomCard } from "@/components/rooms/room-card";
import { AddRoomInput } from "@/components/rooms/add-room-input";

export default function RoomsPage() {
  const [rooms, setRooms] = React.useState<SavedRoom[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  const loadRooms = () => {
    setRooms(getSavedRooms());
  };

  React.useEffect(() => {
    loadRooms();
    setLoaded(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="border-b py-4 px-4 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-[#FF6B2C]">
                STRANGR
              </span>
              <span className="font-mono text-sm text-muted-foreground">
                /
              </span>
              <span className="font-mono text-sm font-medium">
                My Connections
              </span>
            </div>
          </div>
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {loaded && rooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center py-20 gap-4"
          >
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-mono text-lg font-bold">No connections yet</h2>
            <p className="font-mono text-sm text-muted-foreground max-w-sm">
              Start chatting and connect with someone you like! When you both
              accept, you&apos;ll get a private room here.
            </p>
            <Link
              href="/chat"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 text-white font-mono text-sm rounded-lg cursor-pointer transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Start Chatting
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Room list */}
            <div className="space-y-3">
              <AnimatePresence>
                {rooms.map((room, index) => (
                  <motion.div
                    key={room.roomId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <RoomCard
                      room={room}
                      onDelete={(id) => { removeRoom(id); loadRooms(); }}
                      onRename={(id, newName) => {
                        const rooms = getSavedRooms();
                        const r = rooms.find(r => r.roomId === id);
                        if (r) { r.roomName = newName; saveRoom(r); loadRooms(); }
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Add room input */}
            <div className="border-t pt-6">
              <AddRoomInput onRoomAdded={loadRooms} />
            </div>
          </div>
        )}

        {/* Always show add room input in empty state too */}
        {loaded && rooms.length === 0 && (
          <div className="mt-8 border-t pt-6">
            <AddRoomInput onRoomAdded={loadRooms} />
          </div>
        )}
      </main>
    </div>
  );
}
