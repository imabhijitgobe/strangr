"use client";

import * as React from "react";
import { Shield, Zap, Users } from "lucide-react";

export default function SafetySection() {
  return (
    <section className="pb-16 sm:pb-24" id="safety">
      <div className="border p-6 sm:p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="shrink-0">
            <div className="rounded-full bg-[#FF6B2C]/10 p-6">
              <Shield className="h-12 w-12 text-[#FF6B2C]" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-mono font-bold mb-4">
              Your Safety Matters
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed mb-6">
              We take safety seriously. All chats are anonymous — no personal
              data is stored. You can report or block anyone instantly. Our
              moderation system works around the clock to keep the platform
              clean.
            </p>
            <div className="flex flex-wrap gap-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 border font-mono text-xs">
                <Shield className="h-3 w-3 text-[#FF6B2C]" />
                Anonymous
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 border font-mono text-xs">
                <Zap className="h-3 w-3 text-[#FF6B2C]" />
                Instant Block
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 border font-mono text-xs">
                <Users className="h-3 w-3 text-[#FF6B2C]" />
                Moderated
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
