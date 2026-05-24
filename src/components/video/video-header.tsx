"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { ChatStatus } from "@/components/chat/types";

interface VideoHeaderProps {
  status: ChatStatus;
  partnerCountry: { name: string; flag: string } | null;
}

export function VideoHeader({ status, partnerCountry }: VideoHeaderProps) {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 px-4 py-3 bg-black/40 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Globe className="h-6 w-6 text-[#FF6B2C]" />
          <span className="font-mono text-lg font-bold text-white">
            Strangr
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {partnerCountry && status === "connected" && (
            <span className="text-xs font-mono text-white/80">
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
          <span className="text-xs font-mono text-white/80">
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
