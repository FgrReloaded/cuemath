"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Keyboard, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { DueCard } from "@/lib/study";

type RatingMeta = {
  label: string;
  hint: string;
  key: "1" | "2" | "3" | "4";
  className: string;
};

const RATINGS: Record<0 | 1 | 2 | 3, RatingMeta> = {
  0: {
    label: "Again",
    hint: "< 10 min",
    key: "1",
    className:
      "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30",
  },
  1: {
    label: "Hard",
    hint: "short",
    key: "2",
    className:
      "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/30",
  },
  2: {
    label: "Good",
    hint: "normal",
    key: "3",
    className:
      "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/30",
  },
  3: {
    label: "Easy",
    hint: "longer",
    key: "4",
    className:
      "border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-950/30",
  },
};

type Tally = { 0: number; 1: number; 2: number; 3: number };

function renderCloze(text: string, showAnswer: boolean) {
  return text.replace(/\{\{c\d+::([^}]+)\}\}/g, (_, inner) =>
    showAnswer ? inner : "_____",
  );
}

export function StudyClient({ initialCards }: { initialCards: DueCard[] }) {
  const [queue] = useState(initialCards);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tally, setTally] = useState<Tally>({ 0: 0, 1: 0, 2: 0, 3: 0 });

  const current = queue[idx];
  const done = idx >= queue.length;
  const progress = useMemo(
    () => (queue.length === 0 ? 0 : (idx / queue.length) * 100),
    [idx, queue.length],
  );

  const submit = useCallback(
    async (rating: 0 | 1 | 2 | 3) => {
      if (!current || submitting) return;
      setSubmitting(true);
      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: current.cardId, rating }),
        });
        if (!res.ok) throw new Error("Could not save review");
        setTally((t) => ({ ...t, [rating]: t[rating] + 1 }));
        setFlipped(false);
        setIdx((i) => i + 1);
      } catch {
        toast.error("Couldn't save that rating. Try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [current, submitting],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (done) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      if (!flipped) return;
      if (e.key === "1") submit(0);
      else if (e.key === "2") submit(1);
      else if (e.key === "3") submit(2);
      else if (e.key === "4") submit(3);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, done, submit]);

  if (done) {
    const reviewed = tally[0] + tally[1] + tally[2] + tally[3];
    const correct = tally[2] + tally[3];
    const accuracy = reviewed === 0 ? 0 : Math.round((correct / reviewed) * 100);
    return (
      <div className="mx-auto flex max-w-xl flex-1 items-center justify-center py-10">
        <Card className="w-full">
          <CardContent className="space-y-6 py-10">
            <div className="space-y-1.5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40">
                <Check className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Session done</h1>
              <p className="text-sm text-zinc-500">
                {reviewed} card{reviewed === 1 ? "" : "s"} reviewed · {accuracy}% recall
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {([0, 1, 2, 3] as const).map((r) => (
                <div
                  key={r}
                  className="rounded-lg border border-zinc-200 p-3 text-center dark:border-zinc-800"
                >
                  <div className="text-2xl font-semibold tabular-nums">
                    {tally[r]}
                  </div>
                  <div className="text-xs text-zinc-500">{RATINGS[r].label}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">Back to dashboard</Link>
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  window.location.href = "/study";
                }}
              >
                More
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="truncate">{current.deckTitle}</span>
          <span className="tabular-nums">
            {idx + 1} / {queue.length}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <motion.div
            className="h-full rounded-full bg-zinc-900 dark:bg-white"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="flex-1 min-h-[360px]" style={{ perspective: 1200 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.cardId}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="relative w-full"
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.div
              className="relative"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ transformStyle: "preserve-3d" }}
              onClick={() => !submitting && setFlipped((f) => !f)}
            >
              <CardFace side="front">
                {current.type === "cloze"
                  ? renderCloze(current.front, false)
                  : current.front}
              </CardFace>
              <CardFace side="back">
                <div className="space-y-4">
                  {current.type === "cloze" ? (
                    <>
                      <p className="text-sm text-zinc-500">Question</p>
                      <p className="text-lg">
                        {renderCloze(current.front, true)}
                      </p>
                      <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
                    </>
                  ) : null}
                  <div className="whitespace-pre-wrap text-lg leading-relaxed">
                    {current.back}
                  </div>
                </div>
              </CardFace>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6">
        {!flipped ? (
          <Button
            size="lg"
            className="w-full"
            onClick={() => setFlipped(true)}
            disabled={submitting}
          >
            Reveal answer
            <kbd className="ml-2 rounded border border-white/20 bg-white/10 px-1.5 text-xs font-medium">
              Space
            </kbd>
          </Button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {([0, 1, 2, 3] as const).map((r) => (
              <Button
                key={r}
                variant="outline"
                className={`h-auto flex-col gap-1 py-3 ${RATINGS[r].className}`}
                onClick={() => submit(r)}
                disabled={submitting}
              >
                <span className="font-semibold">{RATINGS[r].label}</span>
                <span className="text-[10px] uppercase tracking-wide opacity-70">
                  {RATINGS[r].hint}
                </span>
                <kbd className="mt-0.5 rounded border border-current/20 px-1 text-[10px]">
                  {RATINGS[r].key}
                </kbd>
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-zinc-400">
        <Keyboard className="h-3 w-3" />
        <span>Space to flip · 1–4 to rate</span>
        <Badge variant="outline" className="font-normal">
          <X className="mr-1 h-2.5 w-2.5" />
          <Link href="/" className="hover:text-zinc-700 dark:hover:text-zinc-300">
            Exit
          </Link>
        </Badge>
      </div>
    </div>
  );
}

function CardFace({
  side,
  children,
}: {
  side: "front" | "back";
  children: React.ReactNode;
}) {
  const base =
    "flex min-h-[360px] items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950";
  return (
    <div
      className={
        side === "front" ? `relative ${base}` : `absolute inset-0 ${base}`
      }
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: side === "back" ? "rotateY(180deg)" : undefined,
      }}
    >
      <div className="w-full text-center text-xl leading-relaxed">
        {children}
      </div>
    </div>
  );
}
