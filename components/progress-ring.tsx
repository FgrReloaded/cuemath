"use client";

import { motion, useReducedMotion } from "motion/react";

export function ProgressRing({
  value,
  size = 44,
  stroke = 3,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative flex flex-none items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke="currentColor"
          fill="transparent"
          className="text-zinc-200 dark:text-zinc-800"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke="currentColor"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduce ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
          className="text-zinc-900 dark:text-zinc-100"
        />
      </svg>
      {children !== undefined && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
          {children}
        </div>
      )}
    </div>
  );
}
