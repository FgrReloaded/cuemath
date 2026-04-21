"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { BookOpen, ChevronDown, ChevronUp, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/logo";

type SharedCard = {
  front: string;
  back: string;
  type: "basic" | "cloze";
  tags: string[];
};

type SharedDeckData = {
  title: string;
  description: string | null;
  createdAt: string;
  cards: SharedCard[];
};

export function SharedDeckClient({
  token,
  deck,
}: {
  token: string;
  deck: SharedDeckData;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [importing, setImporting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const clozeCount = deck.cards.filter((c) => c.type === "cloze").length;
  const basicCount = deck.cards.length - clozeCount;

  async function importDeck() {
    setImporting(true);
    try {
      const res = await fetch(`/api/shared/${token}/import`, { method: "POST" });
      if (res.status === 401) {
        toast.error("Sign in first to import this deck");
        router.push(`/login?next=/shared/${token}`);
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success("Deck imported — all cards are ready to study!");
      router.push(`/decks/${data.id}`);
    } catch {
      toast.error("Could not import this deck. Try again.");
    } finally {
      setImporting(false);
    }
  }

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : 0.06,
        delayChildren: 0.05,
      },
    },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] },
    },
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2"
            aria-label="Mnemo home"
          >
            <LogoMark className="h-5 w-5 text-foreground transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:-translate-y-px group-hover:rotate-[-4deg]" />
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              Mnemo
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-8 sm:py-14">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-14"
        >
          <motion.section
            variants={item}
            className="grid gap-10 md:grid-cols-12"
          >
            <div className="md:col-span-8 space-y-5">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="gap-1.5 border border-emerald-200/60 text-emerald-700 dark:border-emerald-900/60 dark:text-emerald-400"
                >
                  <BookOpen className="h-3 w-3" />
                  Shared deck
                </Badge>
              </div>
              <h1 className="text-[clamp(2rem,4.5vw,3.25rem)] font-medium leading-[1.02] tracking-[-0.025em]">
                {deck.title}
              </h1>
              {deck.description && (
                <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                  {deck.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  className="group"
                  onClick={importDeck}
                  disabled={importing}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {importing ? "Importing…" : "Import to my library"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPreviewOpen((v) => !v)}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  {previewOpen ? "Hide cards" : "Preview cards"}
                </Button>
              </div>
            </div>

            <aside className="md:col-span-4 md:pt-6">
              <div className="space-y-4 border-l border-border/60 pl-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Cards
                  </p>
                  <p className="mt-1.5 text-3xl font-medium tracking-tight tabular-nums">
                    {deck.cards.length}
                  </p>
                </div>
                <div className="space-y-1 pt-1 text-[11px] tabular-nums text-muted-foreground">
                  <p>
                    <span className="text-foreground">{basicCount}</span> basic
                  </p>
                  <p>
                    <span className="text-foreground">{clozeCount}</span> cloze
                  </p>
                </div>
                <p className="pt-2 text-[11px] text-muted-foreground">
                  Created{" "}
                  {new Date(deck.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </aside>
          </motion.section>

          {previewOpen && (
            <motion.section
              variants={item}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              <div className="border-b border-border/70 pb-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Preview · {deck.cards.length} cards
                </p>
                <h2 className="mt-1 text-lg font-medium tracking-tight">
                  Contents
                </h2>
              </div>
              <ol className="divide-y divide-border/60">
                {deck.cards.map((card, i) => {
                  const isExpanded = expandedCard === i;
                  return (
                    <li key={i} className="py-4">
                      <button
                        type="button"
                        className="flex w-full items-start gap-5 text-left"
                        onClick={() =>
                          setExpandedCard(isExpanded ? null : i)
                        }
                      >
                        <span className="mt-1 flex-none text-[11px] tabular-nums text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            {card.type === "cloze" && (
                              <Badge
                                variant="secondary"
                                className="font-normal text-[10px]"
                              >
                                cloze
                              </Badge>
                            )}
                          </div>
                          <p className="whitespace-pre-wrap text-[15px] font-medium leading-snug text-foreground">
                            {card.front}
                          </p>
                          {isExpanded && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="whitespace-pre-wrap pt-2 text-sm leading-relaxed text-muted-foreground"
                            >
                              {card.back}
                            </motion.p>
                          )}
                        </div>
                        <span className="mt-1 flex-none text-muted-foreground">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </motion.section>
          )}

          <motion.footer
            variants={item}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/60 pt-5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
          >
            <span>Mnemo</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>spaced repetition, but patient</span>
          </motion.footer>
        </motion.div>
      </main>
    </div>
  );
}
