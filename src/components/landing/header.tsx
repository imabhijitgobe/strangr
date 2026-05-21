"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Menu, Globe } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "TEXT CHAT", href: "/chat" },
  { title: "VIDEO CHAT", href: "#" },
  { title: "HOW IT WORKS", href: "#how-it-works" },
  { title: "SAFETY", href: "#safety" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-[#FF6B2C]" />
          <span className="font-mono text-lg font-bold">Strangr</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navigationItems.map((item) =>
            item.href.startsWith("/") ? (
              <Link
                key={item.title}
                href={item.href}
                className="text-xs font-mono text-muted-foreground hover:text-[#FF6B2C] transition-colors duration-200"
              >
                {item.title}
              </Link>
            ) : (
              <a
                key={item.title}
                href={item.href}
                className="text-xs font-mono text-muted-foreground hover:text-[#FF6B2C] transition-colors duration-200"
              >
                {item.title}
              </a>
            )
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/chat" className="hidden md:block">
            <Button
              variant="default"
              size="sm"
              className="rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono text-xs cursor-pointer"
            >
              START CHATTING <ArrowRight className="ml-1 w-3 h-3" />
            </Button>
          </Link>
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden cursor-pointer"
                  aria-label="Open menu"
                />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-8 pt-16 px-4">
                {navigationItems.map((item) =>
                  item.href.startsWith("/") ? (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="text-lg font-mono text-foreground hover:text-[#FF6B2C] transition-colors duration-200"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <a
                      key={item.title}
                      href={item.href}
                      className="text-lg font-mono text-foreground hover:text-[#FF6B2C] transition-colors duration-200"
                    >
                      {item.title}
                    </a>
                  )
                )}
                <Link href="/chat">
                  <Button className="w-full cursor-pointer rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono">
                    START CHATTING <ArrowRight className="ml-1 w-4 h-4" />
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
