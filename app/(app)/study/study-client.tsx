"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Confetti } from "@/components/confetti";
import { useCountUp } from "@/lib/use-count-up";
import type { DueCard } from "@/lib/study";

type RatingMeta = {
  label: string;
  hint: string;
  key: "1" | "2" | "3" | "4";
  className: string;
  flash: string;
};

const RATINGS: Record<0 | 1 | 2 | 3, RatingMeta> = {
  0: {
    label: "Again",
    hint: "< 10 min",
    key: "1",
    className:
      "border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40",
    flash: "oklch(0.78 0.14 20 / 0.18)",
  },
  1: {
    label: "Hard",
    hint: "short",
    key: "2",
    className:
      "border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 dark:border-amber-900/60 dark:text-amber-400 dark:hover:bg-amber-950/40",
    flash: "oklch(0.82 0.14 80 / 0.18)",
  },
  2: {
    label: "Good",
    hint: "normal",
    key: "3",
    className:
      "border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-900/60 dark:text-emerald-400 dark:hover:bg-emerald-950/40",
    flash: "oklch(0.78 0.14 150 / 0.18)",
  },
  3: {
    label: "Easy",
    hint: "longer",
    key: "4",
    className:
      "border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300 dark:border-sky-900/60 dark:text-sky-400 dark:hover:bg-sky-950/40",
    flash: "oklch(0.78 0.13 240 / 0.18)",
  },
};

type Tally = { 0: number; 1: number; 2: number; 3: number };

const AGAIN_LINES = [
  "No worries — we'll bring it back soon.",
  "Filed for a quick return.",
  "Back around in a few minutes.",
];

function pickLine(pool: string[], seed: number) {
  return pool[seed % pool.length];
}

function renderCloze(text: string, showAnswer: boolean) {
  return text.replace(/\{\{c\d+::([^}]+)\}\}/g, (_, inner) =>
    showAnswer ? inner : "_____",
  );
}

function accuracyHeadline(acc: number, reviewed: number) {
  if (reviewed === 0) return "Session saved";
  if (acc === 100) return "Flawless run.";
  if (acc >= 90) return "Razor sharp today.";
  if (acc >= 75) return "Solid session.";
  if (acc >= 50) return "Good work — these are sticking.";
  return "You showed up. That's how it builds.";
}

function accuracySub(acc: number, reviewed: number) {
  if (reviewed === 0) return "Come back when you're ready.";
  if (acc === 100) return "Every card landed. Enjoy it — they're not all this kind.";
  if (acc >= 75) return "Your memory did the lifting.";
  if (acc >= 50) return "The misses are where the growth lives.";
  return "The tough ones are teeing up for tomorrow.";
}

export function StudyClient({ initialCards }: { initialCards: DueCard[] }) {
  const [queue] = useState(initialCards);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tally, setTally] = useState<Tally>({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const [flash, setFlash] = useState<0 | 1 | 2 | 3 | null>(null);
  const [againSeed, setAgainSeed] = useState(0);
  const reduce = useReducedMotion();

  const current = queue[idx];
  const done = idx >= queue.length;

  const progressTarget = queue.length === 0 ? 0 : (idx / queue.length) * 100;
  const progressMV = useMotionValue(0);
  const progressSpring = useSpring(progressMV, {
    stiffness: 140,
    damping: 20,
    mass: 0.6,
  });
  const progressWidth = useTransform(progressSpring, (v) => `${v}%`);

  useEffect(() => {
    progressMV.set(progressTarget);
  }, [progressTarget, progressMV]);

  const submit = useCallback(
    async (rating: 0 | 1 | 2 | 3) => {
      if (!current || submitting) return;
      setSubmitting(true);
      setFlash(rating);
      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: current.cardId, rating }),
        });
        if (!res.ok) throw new Error("Could not save review");
        setTally((t) => ({ ...t, [rating]: t[rating] + 1 }));
        if (rating === 0) {
          setAgainSeed((s) => s + 1);
          toast(pickLine(AGAIN_LINES, againSeed), {
            duration: 1600,
            className: "font-normal",
          });
        }
        await new Promise((r) => setTimeout(r, reduce ? 0 : 180));
        setFlipped(false);
        setIdx((i) => i + 1);
      } catch {
        toast.error("Couldn't save that rating. Try again.");
      } finally {
        setFlash(null);
        setSubmitting(false);
      }
    },
    [current, submitting, againSeed, reduce],
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

  if (done) return <SessionSummary tally={tally} />;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="truncate">{current.deckTitle}</span>
          <span className="tabular-nums">
            <span className="text-zinc-900 dark:text-zinc-100">{idx + 1}</span>
            <span className="mx-1 text-zinc-300 dark:text-zinc-700">/</span>
            {queue.length}
          </span>
        </div>
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <motion.div
            className="h-full rounded-full bg-zinc-900 dark:bg-white"
            style={{ width: progressWidth }}
          />
          <motion.div
            key={idx}
            aria-hidden
            className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/30"
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: "200%", opacity: [0, 1, 0] }}
            transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </div>
      </div>

      <div className="relative flex-1 min-h-[360px]" style={{ perspective: 1400 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.cardId}
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.99 }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative w-full"
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.div
              className="relative cursor-pointer"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              style={{ transformStyle: "preserve-3d" }}
              onClick={() => !submitting && setFlipped((f) => !f)}
              whileHover={reduce ? undefined : { y: -2 }}
            >
              <CardFace side="front" flipped={flipped}>
                {current.type === "cloze"
                  ? renderCloze(current.front, false)
                  : current.front}
              </CardFace>
              <CardFace side="back" flipped={flipped}>
                <div className="space-y-4">
                  {current.type === "cloze" ? (
                    <>
                      <p className="text-[11px] uppercase tracking-wider text-zinc-400">
                        Question
                      </p>
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

            <AnimatePresence>
              {flash !== null && (
                <motion.div
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{
                    boxShadow: `inset 0 0 0 2px ${RATINGS[flash].flash.replace(" / 0.18", " / 0.6")}`,
                    background: RATINGS[flash].flash,
                  }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6">
        <AnimatePresence mode="wait" initial={false}>
          {!flipped ? (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <Button
                size="lg"
                className="w-full group"
                onClick={() => setFlipped(true)}
                disabled={submitting}
              >
                <span>Reveal answer</span>
                <motion.span
                  aria-hidden
                  className="ml-2 inline-flex h-5 items-center rounded-md border border-white/25 bg-white/10 px-1.5 text-[11px] font-medium"
                  animate={reduce ? undefined : { y: [0, -1.5, 0] }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  Space
                </motion.span>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="ratings"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              className="grid grid-cols-4 gap-2"
            >
              {([0, 1, 2, 3] as const).map((r, i) => (
                <motion.button
                  key={r}
                  type="button"
                  onClick={() => submit(r)}
                  disabled={submitting}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  whileHover={reduce ? undefined : { y: -2 }}
                  whileTap={reduce ? undefined : { scale: 0.96 }}
                  className={`flex h-auto flex-col items-center gap-1 rounded-md border bg-transparent py-3 text-sm font-medium transition-colors disabled:opacity-50 ${RATINGS[r].className}`}
                >
                  <span className="font-semibold">{RATINGS[r].label}</span>
                  <span className="text-[10px] uppercase tracking-wide opacity-70">
                    {RATINGS[r].hint}
                  </span>
                  <kbd className="mt-0.5 rounded border border-current/20 px-1 text-[10px]">
                    {RATINGS[r].key}
                  </kbd>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-zinc-400 dark:text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Space
          </kbd>
          flip
        </span>
        <span className="inline-flex items-center gap-1.5">
          <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            1–4
          </kbd>
          rate
        </span>
        <Link
          href="/"
          className="underline-offset-4 hover:text-zinc-700 hover:underline dark:hover:text-zinc-300"
        >
          Exit session
        </Link>
      </div>
    </div>
  );
}

function CardFace({
  side,
  flipped,
  children,
}: {
  side: "front" | "back";
  flipped: boolean;
  children: React.ReactNode;
}) {
  const base =
    "flex min-h-[360px] items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] dark:border-zinc-800 dark:bg-zinc-950";
  const activeSide = flipped ? "back" : "front";
  const isActive = side === activeSide;
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
      {side === "front" && !isActive ? null : side === "front" ? (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
          Tap or press space
        </div>
      ) : null}
    </div>
  );
}

function SessionSummary({ tally }: { tally: Tally }) {
  const reviewed = tally[0] + tally[1] + tally[2] + tally[3];
  const correct = tally[2] + tally[3];
  const accuracy = reviewed === 0 ? 0 : Math.round((correct / reviewed) * 100);
  const [fireConfetti, setFireConfetti] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(() => setFireConfetti(true), 180);
    return () => clearTimeout(t);
  }, []);

  const recallShown = useCountUp(accuracy, {
    duration: 1100,
    enabled: reviewed > 0,
  });

  const isWin = accuracy >= 75 && reviewed > 0;
  const headline = accuracyHeadline(accuracy, reviewed);
  const sub = accuracySub(accuracy, reviewed);

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.05 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] as const },
    },
  };

  return (
    <div className="mx-auto flex max-w-xl flex-1 items-center justify-center py-10">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative w-full"
      >
        <Confetti fire={fireConfetti && isWin} count={48} />

        <Card className="relative overflow-hidden">
          <CardContent className="space-y-7 py-10">
            <motion.div variants={item} className="space-y-3 text-center">
              <motion.div
                className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
                  isWin
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                }`}
                initial={reduce ? false : { scale: 0.6, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
              >
                {isWin ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <Sparkles className="h-6 w-6" />
                )}
              </motion.div>
              <h1 className="text-2xl font-semibold tracking-tight">{headline}</h1>
              <p className="mx-auto max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                {sub}
              </p>
            </motion.div>

            <motion.div variants={item} className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-semibold tracking-tight tabular-nums">
                  {Math.round(recallShown)}
                  <span className="text-2xl text-zinc-400">%</span>
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-zinc-500">
                  Recall · {reviewed} card{reviewed === 1 ? "" : "s"}
                </div>
              </div>
            </motion.div>

            <motion.div variants={item} className="grid grid-cols-4 gap-2">
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
            </motion.div>

            <motion.div variants={item} className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">Back to dashboard</Link>
              </Button>
              <Button
                className="flex-1 group"
                onClick={() => {
                  window.location.href = "/study";
                }}
              >
                Keep going
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
