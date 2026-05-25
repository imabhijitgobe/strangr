"use client";

export interface SavedRoom {
  roomId: string;
  roomCode: string;
  roomName?: string;
  alias: string;
  createdAt: string;
  lastVisitedAt: string | null;
}

const STORAGE_KEY = "strangr_rooms";

export function getSavedRooms(): SavedRoom[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveRoom(room: SavedRoom): void {
  if (typeof window === "undefined") return;
  const rooms = getSavedRooms();
  const existing = rooms.findIndex((r) => r.roomId === room.roomId);
  if (existing >= 0) {
    rooms[existing] = room;
  } else {
    rooms.push(room);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

export function removeRoom(roomId: string): void {
  if (typeof window === "undefined") return;
  const rooms = getSavedRooms().filter((r) => r.roomId !== roomId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

export function hasRoom(roomId: string): boolean {
  return getSavedRooms().some((r) => r.roomId === roomId);
}

export function updateLastVisited(roomId: string): void {
  if (typeof window === "undefined") return;
  const rooms = getSavedRooms();
  const room = rooms.find((r) => r.roomId === roomId);
  if (room) {
    room.lastVisitedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  }
}

export function generateRoomCode(): string {
  const words = [
    "WOLF", "BEAR", "LYNX", "HAWK", "DEER", "FOXS", "LION", "PUMA",
    "CROW", "DOVE", "FROG", "GOAT", "HARE", "IBIS", "JADE", "KITE",
    "LARK", "MOTH", "NEWT", "ORCA", "PIKE", "QUIL", "ROOK", "SWAN",
    "TOAD", "VOLE", "WREN", "YAKS", "ZEBU", "ANTS",
  ];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(Math.random() * 90 + 10).toString();
  return `${word}${num}`;
}
