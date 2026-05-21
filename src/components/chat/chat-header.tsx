"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { ChatStatus } from "@/components/chat/types";

interface ChatHeaderProps {
  status: ChatStatus;
  partnerCountry: { name: string; flag: string } | null;
}

export function ChatHeader({ status, partnerCountry }: ChatHeaderProps) {
  return (
    <header className="border-b px-4 py-3 shrink-0">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="flex items-center space-x-2">
          <Globe className="h-6 w-6 text-[#FF6B2C]" />
          <span className="font-mono text-lg font-bold">Strangr</span>
        </Link>

        <div className="flex items-center gap-3">
          {partnerCountry && status === "connected" && (
            <span className="text-xs font-mono text-muted-foreground">
              {partnerCountry.flag} {partnerCountry.name}
            </span>
          )}
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                status === "connected" ? "bg-green-400" : "bg-zinc-400"
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                status === "connected" ? "bg-green-500" : "bg-zinc-500"
              }`}
            ></span>
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            {status === "connected"
              ? "Connected"
              : status === "searching"
                ? "Searching..."
                : "Offline"}
          </span>
        </div>
      </div>
    </header>
  );
}
