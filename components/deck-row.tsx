"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { ProgressRing } from "@/components/progress-ring";

export type DeckRowData = {
  id: string;
  title: string;
  description: string | null;
  cardCount: number;
  dueNow: number;
  mature: number;
  learning: number;
  fresh: number;
  updatedAt: Date | string;
};

function relativeTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dy = Math.floor(h / 24);
  if (dy < 7) return `${dy}d ago`;
  const w = Math.floor(dy / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(dy / 30);
  return `${mo}mo ago`;
}

export function DeckRow({ deck, index = 0 }: { deck: DeckRowData; index?: number }) {
  const reduce = useReducedMotion();
  const mastery =
    deck.cardCount === 0 ? 0 : Math.round((deck.mature / deck.cardCount) * 100);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Link
        href={`/decks/${deck.id}`}
        className="group relative flex items-start gap-5 border-b border-zinc-200/80 py-5 transition-colors hover:bg-zinc-50/60 dark:border-zinc-800/80 dark:hover:bg-zinc-900/30"
      >
        <ProgressRing value={mastery} size={48} stroke={3}>
          {deck.cardCount > 0 ? `${mastery}` : "·"}
        </ProgressRing>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-baseline gap-3">
            <h3 className="truncate text-base font-medium tracking-tight text-zinc-900 transition-colors group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white">
              {deck.title}
            </h3>
            {deck.dueNow > 0 && (
              <span className="flex-none text-[11px] font-medium tabular-nums text-[var(--brand)]">
                {deck.dueNow} due
              </span>
            )}
          </div>
          {deck.description && (
            <p className="line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">
              {deck.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-500">
            <span className="tabular-nums">{deck.cardCount} cards</span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span className="tabular-nums">
              {deck.mature} mature / {deck.learning} learning / {deck.fresh} new
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>{relativeTime(deck.updatedAt)}</span>
          </div>
        </div>

        <div className="flex h-12 flex-none items-center">
          <ArrowUpRight className="h-4 w-4 translate-x-0 translate-y-0 text-zinc-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-900 dark:text-zinc-700 dark:group-hover:text-zinc-100" />
        </div>
      </Link>
    </motion.div>
  );
}
