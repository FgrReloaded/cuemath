"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, BookOpen, Globe } from "lucide-react";

type SharedDeckSummary = {
  title: string;
  description: string | null;
  shareToken: string;
  cardCount: number;
  createdAt: string;
};

export function LibraryClient({ decks }: { decks: SharedDeckSummary[] }) {
  const reduce = useReducedMotion();

  return (
    <div className="space-y-14">
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-emerald-100/70 dark:bg-emerald-950/40">
            <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Community
          </p>
        </div>

        <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.02] tracking-[-0.025em]">
          Shared library
        </h1>
        <p className="max-w-lg text-[15px] text-muted-foreground">
          Decks shared by the community. Preview any deck and import it into
          your own library with one click.
        </p>
      </section>

      {decks.length === 0 ? (
        <div className="border-y border-dashed border-border/70 py-16 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No shared decks yet. Be the first — open a deck and hit Share.
          </p>
        </div>
      ) : (
        <section>
          <div className="flex items-end justify-between border-b border-border/70 pb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Available
              </p>
              <h2 className="mt-1 text-xl font-medium tracking-tight">
                {decks.length} deck{decks.length === 1 ? "" : "s"}
              </h2>
            </div>
          </div>

          <div>
            {decks.map((deck, i) => (
              <motion.div
                key={deck.shareToken}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.04,
                  ease: [0.2, 0.8, 0.2, 1],
                }}
              >
                <Link
                  href={`/shared/${deck.shareToken}`}
                  className="group relative flex items-start gap-5 border-b border-zinc-200/80 py-5 transition-colors hover:bg-zinc-50/60 dark:border-zinc-800/80 dark:hover:bg-zinc-900/30"
                >
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-border/70 bg-card/40">
                    <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="truncate text-base font-medium tracking-tight text-zinc-900 transition-colors group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white">
                      {deck.title}
                    </h3>
                    {deck.description && (
                      <p className="line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {deck.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-500">
                      <span className="tabular-nums">
                        {deck.cardCount} cards
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">
                        ·
                      </span>
                      <span>
                        {new Date(deck.createdAt).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex h-12 flex-none items-center">
                    <ArrowUpRight className="h-4 w-4 translate-x-0 translate-y-0 text-zinc-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-900 dark:text-zinc-700 dark:group-hover:text-zinc-100" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
