"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CtaSection() {
  return (
    <section className="pb-16 sm:pb-24 px-4">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold mb-4">
          Ready to Meet Someone New?
        </h2>
        <p className="text-muted-foreground font-mono mb-8 max-w-lg mx-auto">
          No registration. No profiles. Just real conversations with real
          people.
        </p>
        <Link href="/chat">
          <Button
            size="lg"
            className="cursor-pointer rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
          >
            START NOW <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
