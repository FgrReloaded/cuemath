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
import { Card, CardContent } from "@/components/ui/card";
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
  { at: 4500, label: "Finding what matters", sub: "Spotting the concepts, definitions, and claims worth remembering." },
  { at: 11000, label: "Writing the deck", sub: "Drafting atomic questions — one idea per card." },
  { at: 20000, label: "Polishing", sub: "Dropping the weak ones, tightening the rest." },
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
      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <FileText className="h-3.5 w-3.5" />
              <span>From {filename}</span>
              <span>·</span>
              <span>
                <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                  {cards.length}
                </strong>{" "}
                card{cards.length === 1 ? "" : "s"} generated
              </span>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="deck-title">Deck title</Label>
                <Input
                  id="deck-title"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  className="text-base font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deck-description">Description</Label>
                <Textarea
                  id="deck-description"
                  value={deckDescription}
                  onChange={(e) => setDeckDescription(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Review cards</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setCards((c) => [
                ...c,
                { id: uid(), front: "", back: "", type: "basic", tags: [] },
              ])
            }
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add card
          </Button>
        </div>

        <div className="grid gap-3">
          <AnimatePresence initial={false}>
            {cards.map((card, i) => (
              <motion.div
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
                      cs.map((c) => (c.id === card.id ? { ...c, ...next } : c)),
                    )
                  }
                  onDelete={() =>
                    setCards((cs) => cs.filter((c) => c.id !== card.id))
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white/90 p-3 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
          <Button variant="ghost" onClick={reset}>
            Discard
          </Button>
          <Button
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
    );
  }

  return (
    <motion.div
      animate={{ scale: dragActive ? 1.01 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive
            ? "border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-900/50"
            : "border-zinc-200 dark:border-zinc-800"
        }`}
      >
        <CardContent
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragActive(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
          className="flex flex-col items-center justify-center gap-4 py-20 text-center"
        >
          <motion.div
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900"
            animate={
              dragActive
                ? { y: [-2, -6, -2], rotate: [-2, 2, -2] }
                : { y: 0, rotate: 0 }
            }
            transition={
              dragActive
                ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.25 }
            }
          >
            <UploadIcon className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
          </motion.div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold tracking-tight">
              {dragActive ? "Drop it here" : "Drop a PDF to build your deck"}
            </h3>
            <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
              Class notes, a chapter, a research paper — up to 15 MB. We&apos;ll do
              the rest.
            </p>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Button onClick={() => fileRef.current?.click()}>Choose file</Button>
            <span className="text-xs text-zinc-400">or drag &amp; drop</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </CardContent>
      </Card>
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
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-5 py-20 text-center">
        <div className="relative">
          {!reduce && (
            <>
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ background: "oklch(0.82 0.12 80 / 0.25)" }}
                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
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
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            animate={reduce ? undefined : { rotate: [0, 8, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-6 w-6" />
          </motion.div>
        </div>

        <div className="min-h-[58px] space-y-1">
          <AnimatePresence mode="wait">
            <motion.h3
              key={current.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-lg font-semibold tracking-tight"
            >
              {current.label}
            </motion.h3>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p
              key={current.sub}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="mx-auto max-w-sm text-sm text-zinc-500 dark:text-zinc-400"
            >
              {current.sub}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="w-56 space-y-2">
          <div className="relative h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <motion.div
              className="h-full rounded-full bg-zinc-900 dark:bg-white"
              initial={{ width: "0%" }}
              animate={{ width: `${softEstimate}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            {!reduce && (
              <motion.div
                aria-hidden
                className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/40"
                animate={{ x: ["-40px", "224px"] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </div>
          <p className="truncate text-[11px] text-zinc-400">
            {filename ?? "Working on your file"}
          </p>
        </div>
      </CardContent>
    </Card>
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
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
              {index + 1}
            </span>
            <Badge variant="secondary" className="font-normal">
              {card.type}
            </Badge>
            {card.tags?.slice(0, 2).map((t) => (
              <Badge key={t} variant="outline" className="font-normal text-xs">
                {t}
              </Badge>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-red-600"
            onClick={onDelete}
            aria-label="Delete card"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-zinc-500">
              Front
            </Label>
            <Textarea
              value={card.front}
              onChange={(e) => onChange({ front: e.target.value })}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-zinc-500">
              Back
            </Label>
            <Textarea
              value={card.back}
              onChange={(e) => onChange({ back: e.target.value })}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
