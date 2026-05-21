"use client";

import * as React from "react";
import { Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-[#FF6B2C]" />
          <span className="font-mono text-sm font-bold">Strangr</span>
        </div>
        <p className="text-xs font-mono text-muted-foreground">
          Talk to strangers. Make connections. Stay anonymous.
        </p>
        <div className="flex gap-6">
          <a
            href="#"
            className="text-xs font-mono text-muted-foreground hover:text-[#FF6B2C] transition-colors duration-200"
          >
            TERMS
          </a>
          <a
            href="#"
            className="text-xs font-mono text-muted-foreground hover:text-[#FF6B2C] transition-colors duration-200"
          >
            PRIVACY
          </a>
          <a
            href="#"
            className="text-xs font-mono text-muted-foreground hover:text-[#FF6B2C] transition-colors duration-200"
          >
            SAFETY
          </a>
        </div>
      </div>
    </footer>
  );
}
