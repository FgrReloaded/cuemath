"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { HeatmapDay } from "@/lib/progress";

function intensity(count: number, max: number): number {
  if (count === 0) return 0;
  if (max <= 1) return 4;
  const ratio = count / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

const LEVELS = [
  "bg-zinc-100 dark:bg-zinc-900",
  "bg-emerald-200 dark:bg-emerald-950/60",
  "bg-emerald-300 dark:bg-emerald-900/80",
  "bg-emerald-500 dark:bg-emerald-700",
  "bg-emerald-600 dark:bg-emerald-500",
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type Hovered = { day: HeatmapDay; x: number; y: number } | null;

export function Heatmap({ days }: { days: HeatmapDay[] }) {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<Hovered>(null);

  if (days.length === 0) return null;

  const max = Math.max(1, ...days.map((d) => d.count));

  const firstDay = new Date(days[0].date);
  const leadingEmpty = firstDay.getUTCDay();
  const padded: (HeatmapDay | null)[] = [
    ...Array.from({ length: leadingEmpty }, () => null),
    ...days,
  ];
  const weeks: (HeatmapDay | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  const monthLabels: { weekIdx: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wIdx) => {
    const firstReal = week.find((d): d is HeatmapDay => d !== null);
    if (!firstReal) return;
    const m = new Date(firstReal.date).getUTCMonth();
    if (m !== lastMonth) {
      monthLabels.push({ weekIdx: wIdx, label: MONTHS[m] });
      lastMonth = m;
    }
  });

  return (
    <div data-heatmap className="relative space-y-2">
      <div className="flex gap-[3px] pl-6 text-[10px] text-zinc-500">
        {weeks.map((_, wIdx) => {
          const label = monthLabels.find((m) => m.weekIdx === wIdx);
          return (
            <div key={wIdx} className="w-[11px] text-left">
              {label ? label.label : ""}
            </div>
          );
        })}
      </div>

      <div className="flex gap-[3px]">
        <div className="flex flex-col gap-[3px] pr-1 text-[10px] text-zinc-500">
          <div className="h-[11px]" />
          <div className="h-[11px] leading-[11px]">Mon</div>
          <div className="h-[11px]" />
          <div className="h-[11px] leading-[11px]">Wed</div>
          <div className="h-[11px]" />
          <div className="h-[11px] leading-[11px]">Fri</div>
          <div className="h-[11px]" />
        </div>
        <div
          className="flex gap-[3px]"
          onMouseLeave={() => setHovered(null)}
        >
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, dIdx) => {
                const day = week[dIdx];
                if (!day) {
                  return (
                    <div
                      key={dIdx}
                      className="h-[11px] w-[11px] rounded-sm bg-transparent"
                    />
                  );
                }
                const level = intensity(day.count, max);
                const delay = reduce ? 0 : (wIdx + dIdx) * 0.006;
                return (
                  <motion.div
                    key={dIdx}
                    initial={reduce ? false : { opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay, ease: [0.2, 0.8, 0.2, 1] }}
                    whileHover={reduce ? undefined : { scale: 1.35 }}
                    onMouseEnter={(e) => {
                      const rect = (
                        e.currentTarget as HTMLElement
                      ).getBoundingClientRect();
                      const parent = (
                        e.currentTarget.closest("[data-heatmap]") as HTMLElement | null
                      )?.getBoundingClientRect();
                      setHovered({
                        day,
                        x: rect.left - (parent?.left ?? 0) + rect.width / 2,
                        y: rect.top - (parent?.top ?? 0),
                      });
                    }}
                    className={`h-[11px] w-[11px] rounded-sm transition-shadow hover:shadow-[0_0_0_1.5px_oklch(0_0_0/0.15)] dark:hover:shadow-[0_0_0_1.5px_oklch(1_0_0/0.25)] ${LEVELS[level]}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1 text-[10px] text-zinc-500">
        <span>Less</span>
        {LEVELS.map((cls, i) => (
          <div key={i} className={`h-[11px] w-[11px] rounded-sm ${cls}`} />
        ))}
        <span>More</span>
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            style={{ left: hovered.x, top: hovered.y - 8 }}
            className="absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {hovered.day.count} review{hovered.day.count === 1 ? "" : "s"}
            </span>
            <span className="ml-1.5 text-zinc-500">
              {new Date(hovered.day.date).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              })}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
