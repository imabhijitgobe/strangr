"use client";

import * as React from "react";
import Link from "next/link";
import { MessageSquare, Video, Globe, Users, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getSavedRooms } from "@/lib/rooms";

const labels = [
  { icon: MessageSquare, label: "Text Chat" },
  { icon: Video, label: "Video Chat" },
  { icon: Globe, label: "Global" },
];

export default function HeroSection() {
  const [roomCount, setRoomCount] = React.useState(0);

  React.useEffect(() => {
    setRoomCount(getSavedRooms().length);
  }, []);
  return (
    <section className="py-16 sm:py-24">
      <div className="flex flex-col items-center text-center px-2">
        <motion.h1
          initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-mono text-2xl font-bold sm:text-4xl md:text-5xl lg:text-7xl leading-tight"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0, duration: 0.6 }}
            className="block sm:inline sm:mr-3"
          >
            TALK TO
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="block sm:inline sm:mr-3 text-[#FF6B2C]"
          >
            STRANGERS
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="block sm:inline"
          >
            ANYWHERE
          </motion.span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mt-6 max-w-md sm:max-w-2xl text-sm sm:text-base md:text-lg text-muted-foreground font-mono px-4"
        >
          Connect with random people around the world instantly. No sign-up
          required. Just click and start talking.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          {labels.map((feature, index) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 1.4 + index * 0.15,
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 10,
              }}
              className="flex items-center gap-1.5 px-3"
            >
              <feature.icon className="h-4 w-4 text-[#FF6B2C]" />
              <span className="text-xs sm:text-sm font-mono">{feature.label}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0"
        >
          <Link href="/chat" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto cursor-pointer rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
            >
              <MessageSquare className="mr-2 w-4 h-4" />
              TEXT CHAT
            </Button>
          </Link>
          <Link href="/video" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto cursor-pointer rounded-none font-mono border-[#FF6B2C] text-[#FF6B2C] hover:bg-[#FF6B2C]/10"
            >
              <Video className="mr-2 w-4 h-4" />
              VIDEO CHAT
            </Button>
          </Link>
        </motion.div>

        {roomCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0, duration: 0.5 }}
            className="mt-4"
          >
            <Link
              href="/rooms"
              className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted border border-border rounded-lg font-mono text-sm cursor-pointer transition-colors"
            >
              <Users className="h-4 w-4 text-[#FF6B2C]" />
              <span>
                💬 You have {roomCount} connection{roomCount !== 1 ? "s" : ""}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </Link>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.6 }}
          className="mt-6 flex items-center gap-2"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            12,847 online now
          </span>
        </motion.div>
      </div>
    </section>
  );
}
