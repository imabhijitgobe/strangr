export type ChatStatus = "idle" | "searching" | "connected" | "disconnected";

export type MessageType = "text" | "system" | "media" | "media-sent";

export interface Message {
  id: string;
  content: string;
  sender: "you" | "stranger" | "system";
  timestamp: Date;
  type?: MessageType;
  mediaData?: string;
  mediaMimeType?: string;
  mediaKind?: "image" | "gif" | "video";
  timer?: number; // seconds before auto-close
  viewed?: boolean;
}

export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB after compression
export const MAX_VIDEO_SIZE = 5 * 1024 * 1024; // 5MB for video/gif
export const DEFAULT_TIMER = 5; // default view timer in seconds

// Convert country code to flag emoji
export function countryCodeToFlag(code: string): string {
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
