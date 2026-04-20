"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

type Particle = {
  id: number;
  dx: number;
  dy: number;
  rot: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
};

const PALETTE = [
  "oklch(0.74 0.18 55)",
  "oklch(0.78 0.16 85)",
  "oklch(0.72 0.16 145)",
  "oklch(0.68 0.17 250)",
  "oklch(0.76 0.18 20)",
  "oklch(0.82 0.12 100)",
];

function buildParticles(count: number, seed: number): Particle[] {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  return Array.from({ length: count }, (_, i) => {
    const angle = rand() * Math.PI * 2;
    const distance = 160 + rand() * 220;
    return {
      id: i,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 80,
      rot: (rand() - 0.5) * 720,
      size: 6 + rand() * 8,
      color: PALETTE[Math.floor(rand() * PALETTE.length)],
      delay: rand() * 0.12,
      duration: 1.1 + rand() * 0.7,
    };
  });
}

export function Confetti({
  fire,
  count = 42,
  seed = 1,
}: {
  fire: boolean;
  count?: number;
  seed?: number;
}) {
  const reduce = useReducedMotion();
  const particles = useMemo(() => buildParticles(count, seed), [count, seed]);

  if (!fire || reduce) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 0.6 }}
          animate={{
            x: p.dx,
            y: p.dy + 380,
            rotate: p.rot,
            opacity: [1, 1, 0],
            scale: 1,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.15, 0.75, 0.3, 1],
            opacity: { times: [0, 0.7, 1], duration: p.duration },
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size * 0.55,
            borderRadius: 2,
            background: p.color,
            boxShadow: `0 0 0 0.5px oklch(0 0 0 / 0.15)`,
          }}
        />
      ))}
    </div>
  );
}
