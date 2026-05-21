"use client";

import * as React from "react";
import { Zap, Shield, Users } from "lucide-react";
import { motion, useAnimation, useInView } from "framer-motion";

const features = [
  {
    icon: Zap,
    label: "Instant Matching",
    description:
      "Get paired with a random stranger in seconds. No waiting, no sign-ups, just pure connection.",
  },
  {
    icon: Shield,
    label: "Anonymous & Safe",
    description:
      "Chat freely without revealing your identity. Report and block anyone who crosses the line.",
  },
  {
    icon: Users,
    label: "Interest-Based",
    description:
      "Add interest tags to match with people who share your passions. Better conversations, guaranteed.",
  },
];

export default function FeaturesSection() {
  const controls = useAnimation();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  React.useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  return (
    <section className="pb-16 sm:pb-24" ref={ref} id="how-it-works">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={controls}
        variants={{
          visible: { opacity: 1, y: 0 },
        }}
        transition={{
          duration: 0.6,
          type: "spring",
          stiffness: 100,
          damping: 10,
        }}
        className="text-center text-4xl font-mono font-bold mb-6"
      >
        How It Works
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={controls}
        variants={{
          visible: { opacity: 1, y: 0 },
        }}
        transition={{
          delay: 0.2,
          duration: 0.6,
        }}
        className="text-center text-muted-foreground font-mono mb-12 max-w-xl mx-auto"
      >
        Three simple steps to connect with someone new
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={controls}
        variants={{
          visible: { opacity: 1 },
        }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-px"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, y: 50 }}
            animate={controls}
            variants={{
              visible: { opacity: 1, y: 0 },
            }}
            transition={{
              delay: 0.4 + index * 0.2,
              duration: 0.6,
              type: "spring",
              stiffness: 100,
              damping: 10,
            }}
            className="flex flex-col items-center text-center p-8 bg-background border"
          >
            <div className="mb-6 rounded-full bg-[#FF6B2C]/10 p-4">
              <feature.icon className="h-8 w-8 text-[#FF6B2C]" />
            </div>
            <h3 className="mb-4 text-xl font-mono font-bold">
              {feature.label}
            </h3>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
