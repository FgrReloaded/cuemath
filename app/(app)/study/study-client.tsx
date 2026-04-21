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
import { ArrowRight, Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/confetti";
import { useCountUp } from "@/lib/use-count-up";
import type { DueCard } from "@/lib/study";

type RatingMeta = {
  label: string;
  hint: string;
  key: "1" | "2" | "3" | "4";
  dot: string;
  flash: string;
};

const RATINGS: Record<0 | 1 | 2 | 3, RatingMeta> = {
  0: {
    label: "Again",
    hint: "< 10 min",
    key: "1",
    dot: "bg-rose-500",
    flash: "oklch(0.78 0.14 20 / 0.18)",
  },
  1: {
    label: "Hard",
    hint: "short",
    key: "2",
    dot: "bg-amber-500",
    flash: "oklch(0.82 0.14 80 / 0.18)",
  },
  2: {
    label: "Good",
    hint: "normal",
    key: "3",
    dot: "bg-emerald-500",
    flash: "oklch(0.78 0.14 150 / 0.18)",
  },
  3: {
    label: "Easy",
    hint: "longer",
    key: "4",
    dot: "bg-sky-500",
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
  const [hints, setHints] = useState<string[]>([]);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintLoading, setHintLoading] = useState(false);
  const reduce = useReducedMotion();

  const current = queue[idx];
  const done = idx >= queue.length;

  const fetchHint = useCallback(async () => {
    if (!current || hintLoading) return;
    const nextLevel = hintLevel + 1;
    if (nextLevel > 3) return;
    setHintLoading(true);
    try {
      const res = await fetch(`/api/cards/${current.cardId}/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: nextLevel }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHints((prev) => [...prev, data.hint]);
      setHintLevel(nextLevel);
    } catch {
      toast.error("Couldn't generate a hint");
    } finally {
      setHintLoading(false);
    }
  }, [current, hintLevel, hintLoading]);

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
        setHints([]);
        setHintLevel(0);
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
      if (!flipped && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        fetchHint();
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
  }, [flipped, done, submit, fetchHint]);

  if (done) return <SessionSummary tally={tally} />;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
      <header className="mb-10 space-y-4">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <Link
            href="/"
            className="transition-colors hover:text-foreground"
          >
            ← Exit
          </Link>
          <span className="truncate px-3 normal-case tracking-normal text-foreground">
            {current.deckTitle}
          </span>
          <span className="tabular-nums">
            <span className="text-foreground">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span className="mx-1 opacity-40">/</span>
            {String(queue.length).padStart(2, "0")}
          </span>
        </div>
        <div className="relative h-px w-full bg-border/70">
          <motion.div
            className="absolute inset-y-0 left-0 h-px bg-[var(--brand)]"
            style={{ width: progressWidth }}
          />
          <motion.div
            key={idx}
            aria-hidden
            className="absolute inset-y-[-2px] w-12 bg-gradient-to-r from-transparent via-[var(--brand)]/60 to-transparent"
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: "400%", opacity: [0, 1, 0] }}
            transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </div>
      </header>

      <div
        className="relative flex flex-1 items-center justify-center min-h-[380px]"
        style={{ perspective: 1400 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.cardId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative w-full"
          >
            <motion.div
              className="relative w-full cursor-pointer"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              style={{ transformStyle: "preserve-3d" }}
              onClick={() => !submitting && setFlipped((f) => !f)}
            >
              <CardFace side="front" cardIndex={idx + 1} total={queue.length}>
                {current.type === "cloze"
                  ? renderCloze(current.front, false)
                  : current.front}
              </CardFace>
              <CardFace side="back" cardIndex={idx + 1} total={queue.length}>
                <div className="space-y-6 text-left">
                  {current.type === "cloze" ? (
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                        Prompt
                      </p>
                      <p className="text-lg leading-snug text-muted-foreground">
                        {renderCloze(current.front, true)}
                      </p>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      Answer
                    </p>
                    <div className="whitespace-pre-wrap text-[22px] leading-[1.4] tracking-[-0.01em] text-foreground">
                      {current.back}
                    </div>
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
                  className="pointer-events-none absolute inset-0 rounded-[20px]"
                  style={{
                    boxShadow: `inset 0 0 0 2px ${RATINGS[flash].flash.replace(" / 0.18", " / 0.55")}`,
                    background: RATINGS[flash].flash,
                  }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-10">
        <AnimatePresence mode="wait" initial={false}>
          {!flipped ? (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col items-center gap-3"
            >
              <AnimatePresence mode="sync">
                {hints.length > 0 && (
                  <motion.div
                    key="hints"
                    initial={{ opacity: 0, y: 6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                    className="w-full max-w-sm space-y-2"
                  >
                    {hints.map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.25 }}
                        className="flex items-start gap-2.5 rounded-lg border border-amber-200/60 bg-amber-50/50 px-3.5 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/20"
                      >
                        <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-500" />
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-amber-600/80 dark:text-amber-400/80">
                            Hint {i + 1}
                          </p>
                          <p className="text-sm leading-snug text-foreground">
                            {h}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex w-full max-w-sm gap-2">
                <Button
                  size="lg"
                  className="group flex-1"
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
                {hintLevel < 3 && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={fetchHint}
                    disabled={hintLoading || submitting}
                    className="gap-1.5 border-amber-200/60 text-amber-700 hover:bg-amber-50/80 hover:text-amber-800 dark:border-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                  >
                    {hintLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Lightbulb className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {hintLevel === 0 ? "Hint" : `Hint ${hintLevel + 1}`}
                    </span>
                    <kbd className="hidden rounded border border-amber-300/50 bg-amber-100/50 px-1 py-0.5 font-mono text-[10px] text-amber-600/80 sm:inline dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-400/80">
                      H
                    </kbd>
                  </Button>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground">
                {hints.length > 0
                  ? hintLevel < 3
                    ? "Need more? Press H for a stronger hint."
                    : "Max hints reached — try your best, then flip."
                  : "Try to answer before you flip — that\u2019s where recall happens."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="ratings"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              className="space-y-3"
            >
              <p className="text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                How did you recall it?
              </p>
              <div className="grid grid-cols-4 gap-2">
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
                    className="group flex flex-col items-center gap-1.5 rounded-lg border border-border/70 bg-card/40 py-3 text-sm font-medium transition-colors hover:border-foreground/40 hover:bg-card disabled:opacity-50"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${RATINGS[r].dot}`}
                    />
                    <span className="text-sm">{RATINGS[r].label}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {RATINGS[r].hint}
                    </span>
                    <kbd className="rounded border border-border/70 bg-background px-1.5 text-[10px] font-mono text-muted-foreground">
                      {RATINGS[r].key}
                    </kbd>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CardFace({
  side,
  cardIndex,
  total,
  children,
}: {
  side: "front" | "back";
  cardIndex: number;
  total: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${
        side === "front" ? "relative" : "absolute inset-0"
      } flex min-h-[380px] flex-col justify-between rounded-[20px] border border-border/70 bg-card p-10 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_32px_-18px_rgba(0,0,0,0.12)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04),0_20px_40px_-24px_rgba(0,0,0,0.7)]`}
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: side === "back" ? "rotateY(180deg)" : undefined,
      }}
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>{side === "front" ? "Prompt" : "Answer"}</span>
        <span className="tabular-nums">
          {String(cardIndex).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      <div className="flex flex-1 items-center py-8">
        <div
          className={`w-full ${
            side === "front"
              ? "text-center text-[26px] leading-[1.35] tracking-[-0.015em] text-foreground"
              : ""
          }`}
        >
          {children}
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="opacity-0">·</span>
        {side === "front" ? (
          <span className="inline-flex items-center gap-1.5">
            Tap or press
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono tracking-normal normal-case">
              space
            </kbd>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            Rate with
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono tracking-normal normal-case">
              1–4
            </kbd>
          </span>
        )}
        <span className="opacity-0">·</span>
      </div>
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
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.05 },
    },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const },
    },
  };

  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-10">
      <Confetti fire={fireConfetti && isWin} count={48} />
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-12">
        <motion.div variants={item} className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Session · complete
          </p>
          <h1 className="text-[clamp(2.25rem,6vw,4rem)] font-medium leading-[0.98] tracking-[-0.03em]">
            {headline}
          </h1>
          <p className="max-w-md text-[15px] text-muted-foreground">{sub}</p>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-12 items-end gap-4 border-y border-border/70 py-8">
          <div className="col-span-12 md:col-span-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Recall
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-sans text-[clamp(4rem,10vw,6.5rem)] font-medium leading-none tracking-[-0.05em] tabular-nums">
                {Math.round(recallShown)}
              </span>
              <span className="text-3xl text-muted-foreground">%</span>
            </div>
            <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {correct} of {reviewed} correct
            </p>
          </div>

          <div className="col-span-12 md:col-span-7 grid grid-cols-4 gap-3 md:border-l md:border-border/60 md:pl-8">
            {([0, 1, 2, 3] as const).map((r) => (
              <div key={r} className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${RATINGS[r].dot}`} />
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {RATINGS[r].label}
                  </p>
                </div>
                <p className="text-2xl font-medium tabular-nums tracking-tight">
                  {tally[r]}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost">
            <Link href="/">← Back to shelf</Link>
          </Button>
          <Button
            className="group"
            onClick={() => {
              window.location.href = "/study";
            }}
          >
            Keep going
            <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
