"use client";

import { motion, useReducedMotion } from "motion/react";

type Segment = {
  key: "mature" | "learning" | "new";
  label: string;
  value: number;
  className: string;
  dotClassName: string;
};

export function MemoryBar({
  mature,
  learning,
  fresh,
  compact = false,
}: {
  mature: number;
  learning: number;
  fresh: number;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const total = mature + learning + fresh;

  const segments: Segment[] = [
    {
      key: "mature",
      label: "Mature",
      value: mature,
      className: "bg-emerald-500 dark:bg-emerald-500/90",
      dotClassName: "bg-emerald-500",
    },
    {
      key: "learning",
      label: "Learning",
      value: learning,
      className: "bg-amber-400 dark:bg-amber-500/90",
      dotClassName: "bg-amber-400 dark:bg-amber-500",
    },
    {
      key: "new",
      label: "New",
      value: fresh,
      className: "bg-zinc-300 dark:bg-zinc-600",
      dotClassName: "bg-zinc-300 dark:bg-zinc-600",
    },
  ];

  if (total === 0) {
    return (
      <div className="space-y-3">
        <div
          className={`w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900 ${
            compact ? "h-1.5" : "h-2"
          }`}
        />
        {!compact && (
          <p className="text-xs text-zinc-500">
            Your memory graph will build here as you study.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-1.5" : "space-y-3"}>
      <div
        className={`flex w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900 ${
          compact ? "h-1.5" : "h-2.5"
        }`}
      >
        {segments.map((s, i) => {
          const pct = (s.value / total) * 100;
          if (pct === 0) return null;
          return (
            <motion.div
              key={s.key}
              className={s.className}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{
                duration: 0.9,
                delay: i * 0.08,
                ease: [0.2, 0.8, 0.2, 1],
              }}
            />
          );
        })}
      </div>
      {!compact && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
          {segments.map((s) => {
            const pct = total === 0 ? 0 : Math.round((s.value / total) * 100);
            return (
              <div key={s.key} className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${s.dotClassName}`} />
                <span className="text-zinc-600 dark:text-zinc-400">{s.label}</span>
                <span className="tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                  {s.value}
                </span>
                <span className="tabular-nums text-zinc-400 dark:text-zinc-600">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
