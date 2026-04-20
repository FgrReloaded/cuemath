"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload as UploadIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { GeneratedCard, GeneratedDeck } from "@/lib/ai/generate";

type GenerateResponse = GeneratedDeck & {
  sourceFilename: string;
  pages: number;
};

type Phase = "idle" | "generating" | "preview" | "saving";

type EditableCard = GeneratedCard & { id: string };

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const GENERATION_PHASES = [
  { at: 0, label: "Reading your PDF", sub: "Pulling text from every page." },
  {
    at: 4500,
    label: "Finding what matters",
    sub: "Spotting the concepts, definitions, and claims worth remembering.",
  },
  {
    at: 11000,
    label: "Writing the deck",
    sub: "Drafting atomic questions — one idea per card.",
  },
  {
    at: 20000,
    label: "Polishing",
    sub: "Dropping the weak ones, tightening the rest.",
  },
];

export function UploadClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [cards, setCards] = useState<EditableCard[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.type && file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File too large (max 15 MB).");
      return;
    }

    setFilename(file.name);
    setPhase("generating");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/decks/generate", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({ error: null }))) as {
          error?: string;
        };
        throw new Error(error ?? "Something went wrong.");
      }

      const data = (await res.json()) as GenerateResponse;
      setDeckTitle(data.title);
      setDeckDescription(data.description);
      setCards(data.cards.map((c) => ({ ...c, id: uid() })));
      setPhase("preview");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed.";
      toast.error(msg);
      setPhase("idle");
      setFilename(null);
    }
  }

  function reset() {
    setPhase("idle");
    setFilename(null);
    setDeckTitle("");
    setDeckDescription("");
    setCards([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSave() {
    setPhase("saving");
    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: deckTitle.trim(),
          description: deckDescription.trim() || undefined,
          sourceFilename: filename ?? undefined,
          cards: cards.map(({ front, back, type, tags }) => ({
            front: front.trim(),
            back: back.trim(),
            type,
            tags,
          })),
        }),
      });
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({ error: null }))) as {
          error?: string;
        };
        throw new Error(error ?? "Failed to save deck.");
      }
      await res.json();
      toast.success(`Deck saved · ${cards.length} cards ready`);
      router.push("/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save deck.";
      toast.error(msg);
      setPhase("preview");
    }
  }

  if (phase === "generating") {
    return <GeneratingState filename={filename} />;
  }

  if (phase === "preview" || phase === "saving") {
    return (
      <div className="space-y-12 pb-24">
        <header className="space-y-5 border-b border-border/70 pb-8">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span className="truncate normal-case tracking-normal">
              {filename}
            </span>
            <span className="opacity-50">·</span>
            <span>
              <span className="tabular-nums text-foreground normal-case tracking-normal">
                {cards.length}
              </span>{" "}
              cards drafted
            </span>
          </div>
          <div className="space-y-3">
            <Label
              htmlFor="deck-title"
              className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
            >
              Deck title
            </Label>
            <Input
              id="deck-title"
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
              className="h-auto border-0 border-b border-border bg-transparent px-0 text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] shadow-none focus-visible:border-[var(--brand)] focus-visible:ring-0"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="deck-description"
              className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
            >
              Description
            </Label>
            <Textarea
              id="deck-description"
              value={deckDescription}
              onChange={(e) => setDeckDescription(e.target.value)}
              rows={2}
              className="resize-none border-border/60 bg-transparent text-sm"
            />
          </div>
        </header>

        <section className="space-y-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Cards · {cards.length}
              </p>
              <h2 className="mt-1 text-lg font-medium tracking-tight">Review</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setCards((c) => [
                  ...c,
                  { id: uid(), front: "", back: "", type: "basic", tags: [] },
                ])
              }
              className="text-muted-foreground hover:text-foreground"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add card
            </Button>
          </div>

          <ol className="divide-y divide-border/60 border-y border-border/60">
            <AnimatePresence initial={false}>
              {cards.map((card, i) => (
                <motion.li
                  key={card.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <CardEditor
                    index={i}
                    card={card}
                    onChange={(next) =>
                      setCards((cs) =>
                        cs.map((c) =>
                          c.id === card.id ? { ...c, ...next } : c,
                        ),
                      )
                    }
                    onDelete={() =>
                      setCards((cs) => cs.filter((c) => c.id !== card.id))
                    }
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        </section>

        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/95 px-4 py-2.5 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand)]/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
            </span>
            <span>Ready when you are — unsaved changes won&apos;t persist.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={reset}>
              Discard
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={
                phase === "saving" ||
                !deckTitle.trim() ||
                cards.length === 0 ||
                cards.some((c) => !c.front.trim() || !c.back.trim())
              }
            >
              {phase === "saving" ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : null}
              Save deck
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-14">
      <header className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-8 space-y-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            New deck
          </p>
          <h1 className="text-[clamp(2.5rem,6vw,4.25rem)] font-medium leading-[0.98] tracking-[-0.035em]">
            Hand us a{" "}
            <span className="italic font-serif font-normal text-muted-foreground">
              PDF
            </span>
            ,<br />
            take back a deck.
          </h1>
          <p className="max-w-lg text-[15px] text-muted-foreground">
            Lecture notes, a chapter, a research paper. We read it cover to
            cover, then draft atomic cards you can edit before they hit the shelf.
          </p>
        </div>
        <aside className="md:col-span-4 md:pt-2">
          <ol className="space-y-3 border-l border-border/60 pl-5 text-sm">
            <li className="flex gap-3">
              <span className="tabular-nums text-[var(--brand)]">01</span>
              <span className="text-muted-foreground">
                Drop a PDF, up to 15 MB.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="tabular-nums text-[var(--brand)]">02</span>
              <span className="text-muted-foreground">
                Claude drafts 12–25 cards.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="tabular-nums text-[var(--brand)]">03</span>
              <span className="text-muted-foreground">
                You edit, then save to shelf.
              </span>
            </li>
          </ol>
        </aside>
      </header>

      <Dropzone
        active={dragActive}
        setActive={setDragActive}
        onFile={handleFile}
        fileRef={fileRef}
      />
    </div>
  );
}

function Dropzone({
  active,
  setActive,
  onFile,
  fileRef,
}: {
  active: boolean;
  setActive: (v: boolean) => void;
  onFile: (f: File) => void | Promise<void>;
  fileRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <motion.div
      onDragEnter={(e) => {
        e.preventDefault();
        setActive(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setActive(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setActive(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void onFile(file);
      }}
      animate={{ scale: active ? 1.005 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`relative overflow-hidden rounded-2xl border border-dashed transition-colors ${
        active
          ? "border-[var(--brand)] bg-[var(--brand)]/[0.04]"
          : "border-border bg-card/40 hover:border-foreground/30"
      }`}
    >
      <div className="grid gap-8 px-8 py-16 md:grid-cols-12 md:items-center md:px-12">
        <div className="md:col-span-8 space-y-4">
          <motion.div
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border/70"
            animate={
              active
                ? { y: [-2, -6, -2], rotate: [-2, 2, -2] }
                : { y: 0, rotate: 0 }
            }
            transition={
              active
                ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.25 }
            }
          >
            <UploadIcon className="h-5 w-5 text-foreground" />
          </motion.div>
          <h2 className="text-2xl font-medium leading-tight tracking-[-0.02em]">
            {active ? "Let go — we've got it." : "Drop a PDF anywhere here."}
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Up to 15 MB, text-based PDFs work best. Scanned docs need OCR, which
            we don&apos;t do yet.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <Button onClick={() => fileRef.current?.click()}>
              <UploadIcon className="mr-1.5 h-3.5 w-3.5" />
              Choose file
            </Button>
            <span className="text-xs text-muted-foreground">
              or drag &amp; drop
            </span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
        </div>

        <div className="md:col-span-4 md:border-l md:border-border/60 md:pl-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Works well with
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <li>· Textbook chapters</li>
            <li>· Lecture notes</li>
            <li>· Research papers</li>
            <li>· Study guides</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

function GeneratingState({ filename }: { filename: string | null }) {
  const reduce = useReducedMotion();
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const tick = setInterval(() => {
      const e = performance.now() - start;
      setElapsed(e);
      const next = GENERATION_PHASES.findIndex((p, i) => {
        const nextAt = GENERATION_PHASES[i + 1]?.at ?? Infinity;
        return e >= p.at && e < nextAt;
      });
      if (next >= 0) setPhaseIdx(next);
    }, 250);
    return () => clearInterval(tick);
  }, []);

  const current = GENERATION_PHASES[phaseIdx];
  const softEstimate = Math.min(92, Math.round((elapsed / 28000) * 100));

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col justify-center space-y-10">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center">
            {!reduce && (
              <>
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ background: "oklch(0.82 0.12 80 / 0.25)" }}
                  animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ background: "oklch(0.78 0.14 55 / 0.18)" }}
                  animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.8,
                  }}
                />
              </>
            )}
            <motion.div
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background"
              animate={reduce ? undefined : { rotate: [0, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
          </div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Generating · step {phaseIdx + 1} of {GENERATION_PHASES.length}
          </p>
        </div>

        <div className="min-h-[84px] space-y-2">
          <AnimatePresence mode="wait">
            <motion.h1
              key={current.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[1.05] tracking-[-0.025em]"
            >
              {current.label}
              <span className="text-muted-foreground">.</span>
            </motion.h1>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p
              key={current.sub}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="max-w-md text-[15px] text-muted-foreground"
            >
              {current.sub}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative h-px w-full bg-border/60">
          <motion.div
            className="absolute inset-y-[-1px] left-0 h-[3px] rounded-full bg-[var(--brand)]"
            initial={{ width: "0%" }}
            animate={{ width: `${softEstimate}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          {!reduce && (
            <motion.div
              aria-hidden
              className="absolute inset-y-[-2px] w-16 bg-gradient-to-r from-transparent via-[var(--brand)]/60 to-transparent"
              animate={{ x: ["-40px", "100%"] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </div>
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="truncate pr-4 normal-case tracking-normal">
            {filename ?? "Working on your file"}
          </span>
          <span className="tabular-nums">{softEstimate}%</span>
        </div>
      </div>

      <ol className="space-y-2 border-l border-border/60 pl-5">
        {GENERATION_PHASES.map((p, i) => {
          const isActive = i === phaseIdx;
          const isPast = i < phaseIdx;
          return (
            <li
              key={p.label}
              className={`flex gap-3 text-sm transition-colors ${
                isActive
                  ? "text-foreground"
                  : isPast
                    ? "text-muted-foreground line-through decoration-muted-foreground/50"
                    : "text-muted-foreground/50"
              }`}
            >
              <span className="tabular-nums text-[11px]">
                0{i + 1}
              </span>
              <span>{p.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CardEditor({
  index,
  card,
  onChange,
  onDelete,
}: {
  index: number;
  card: EditableCard;
  onChange: (next: Partial<EditableCard>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="group py-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
          <Badge
            variant="secondary"
            className="font-normal text-[10px] uppercase tracking-wider"
          >
            {card.type}
          </Badge>
          {card.tags?.slice(0, 3).map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="font-normal text-[10px]"
            >
              {t}
            </Badge>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 focus-visible:opacity-100"
          onClick={onDelete}
          aria-label="Delete card"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Front
          </Label>
          <Textarea
            value={card.front}
            onChange={(e) => onChange({ front: e.target.value })}
            rows={3}
            className="resize-none border-border/60 bg-transparent"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Back
          </Label>
          <Textarea
            value={card.back}
            onChange={(e) => onChange({ back: e.target.value })}
            rows={3}
            className="resize-none border-border/60 bg-transparent"
          />
        </div>
      </div>
    </div>
  );
}
