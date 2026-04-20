"use client";

import { motion, useReducedMotion } from "motion/react";
import { Flame } from "lucide-react";

export function AnimatedFlame({
  active,
  size = 20,
}: {
  active: boolean;
  size?: number;
}) {
  const reduce = useReducedMotion();

  if (!active || reduce) {
    return (
      <Flame
        className={active ? "text-amber-500" : "text-zinc-400"}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <motion.span
      aria-hidden
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: "oklch(0.82 0.14 65 / 0.35)" }}
        animate={{ scale: [0.6, 1.15, 0.6], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="relative"
        animate={{
          scale: [1, 1.08, 0.97, 1.04, 1],
          rotate: [0, -1.5, 1, -0.5, 0],
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <Flame
          className="text-amber-500 drop-shadow-[0_0_6px_oklch(0.78_0.16_55/0.55)]"
          style={{ width: size, height: size }}
          fill="currentColor"
          fillOpacity={0.18}
        />
      </motion.span>
    </motion.span>
  );
}
