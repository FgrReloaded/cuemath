"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  Check,
  Pencil,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MemoryBar } from "@/components/memory-bar";
import type { DeckDetail, DeckDetailCard } from "@/lib/decks";

const MATURE = 21;

type DraftCard = {
  front: string;
  back: string;
  type: "basic" | "cloze";
};

function intervalBadge(days: number, lastReviewedAt: Date | null) {
  if (!lastReviewedAt) return { label: "New", tone: "neutral" as const };
  if (days >= MATURE) return { label: "Mature", tone: "good" as const };
  if (days > 0) return { label: "Learning", tone: "warn" as const };
  return { label: "Relearning", tone: "bad" as const };
}

function badgeClass(tone: "good" | "warn" | "bad" | "neutral") {
  switch (tone) {
    case "good":
      return "border-emerald-200/60 text-emerald-700 dark:border-emerald-900/60 dark:text-emerald-400";
    case "warn":
      return "border-amber-200/60 text-amber-700 dark:border-amber-900/60 dark:text-amber-400";
    case "bad":
      return "border-red-200/60 text-red-700 dark:border-red-900/60 dark:text-red-400";
    default:
      return "";
  }
}

export function DeckClient({ deck }: { deck: DeckDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(deck.title);
  const [description, setDescription] = useState(deck.description ?? "");
  const [editingHeader, setEditingHeader] = useState(false);

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftCard>({
    front: "",
    back: "",
    type: "basic",
  });
  const [adding, setAdding] = useState(false);

  const refresh = () => startTransition(() => router.refresh());

  const composition = useMemo(() => {
    let mature = 0;
    let learning = 0;
    let fresh = 0;
    for (const c of deck.cards) {
      if (!c.lastReviewedAt) fresh++;
      else if (c.intervalDays >= MATURE) mature++;
      else learning++;
    }
    return { mature, learning, fresh };
  }, [deck.cards]);

  async function saveHeader() {
    const body = {
      title: title.trim(),
      description: description.trim() || null,
    };
    if (!body.title) {
      toast.error("Title can't be empty");
      return;
    }
    const res = await fetch(`/api/decks/${deck.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      toast.error("Could not update deck");
      return;
    }
    setEditingHeader(false);
    toast.success("Deck updated");
    refresh();
  }

  async function deleteDeck() {
    if (!confirm("Delete this deck and all its cards? This can't be undone.")) return;
    const res = await fetch(`/api/decks/${deck.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete deck");
      return;
    }
    toast.success("Deck deleted");
    router.push("/");
  }

  function beginEdit(card: DeckDetailCard) {
    setDraft({ front: card.front, back: card.back, type: card.type });
    setEditingCardId(card.id);
    setAdding(false);
  }

  async function saveEdit() {
    if (!editingCardId) return;
    const body = {
      front: draft.front.trim(),
      back: draft.back.trim(),
      type: draft.type,
    };
    if (!body.front || !body.back) {
      toast.error("Front and back are required");
      return;
    }
    const res = await fetch(`/api/cards/${editingCardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      toast.error("Could not save card");
      return;
    }
    setEditingCardId(null);
    toast.success("Card saved");
    refresh();
  }

  async function deleteCard(id: string) {
    if (!confirm("Delete this card?")) return;
    const res = await fetch(`/api/cards/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete card");
      return;
    }
    toast.success("Card deleted");
    refresh();
  }

  async function addCard() {
    const body = {
      front: draft.front.trim(),
      back: draft.back.trim(),
      type: draft.type,
    };
    if (!body.front || !body.back) {
      toast.error("Front and back are required");
      return;
    }
    const res = await fetch(`/api/decks/${deck.id}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      toast.error("Could not add card");
      return;
    }
    setAdding(false);
    setDraft({ front: "", back: "", type: "basic" });
    toast.success("Card added");
    refresh();
  }

  return (
    <div className="space-y-14">
      <div>
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Shelf
        </Link>

        <section className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-8 space-y-5">
            {editingHeader ? (
              <div className="space-y-3">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-auto border-0 border-b border-border bg-transparent px-0 text-3xl font-medium tracking-tight shadow-none focus-visible:border-[var(--brand)] focus-visible:ring-0"
                />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveHeader}>
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTitle(deck.title);
                      setDescription(deck.description ?? "");
                      setEditingHeader(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Deck ·{" "}
                  {new Date(deck.updatedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <h1 className="text-[clamp(2rem,4.5vw,3.25rem)] font-medium leading-[1.02] tracking-[-0.025em]">
                  {deck.title}
                </h1>
                {deck.description && (
                  <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                    {deck.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button asChild className="group">
                    <Link href={`/study?deck=${deck.id}`}>
                      <Play className="mr-1.5 h-3.5 w-3.5" />
                      Study
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingHeader(true)}
                    className="text-muted-foreground"
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deleteDeck}
                    className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </>
            )}
          </div>

          {!editingHeader && (
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
                <MemoryBar
                  mature={composition.mature}
                  learning={composition.learning}
                  fresh={composition.fresh}
                  compact
                />
                <div className="space-y-1 pt-1 text-[11px] tabular-nums text-muted-foreground">
                  <p>
                    <span className="text-foreground">{composition.mature}</span>{" "}
                    mature
                  </p>
                  <p>
                    <span className="text-foreground">{composition.learning}</span>{" "}
                    learning
                  </p>
                  <p>
                    <span className="text-foreground">{composition.fresh}</span> new
                  </p>
                </div>
              </div>
            </aside>
          )}
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between border-b border-border/70 pb-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Cards · {deck.cards.length}
            </p>
            <h2 className="mt-1 text-lg font-medium tracking-tight">Contents</h2>
          </div>
          {!adding && !editingCardId && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(true);
                setDraft({ front: "", back: "", type: "basic" });
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add card
            </Button>
          )}
        </div>

        {adding && (
          <div className="rounded-lg border border-dashed border-[var(--brand)]/40 bg-[var(--brand)]/[0.03] p-4">
            <CardEditor draft={draft} setDraft={setDraft} />
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={addCard} disabled={isPending}>
                <Check className="mr-1 h-3.5 w-3.5" />
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAdding(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {deck.cards.length === 0 && !adding ? (
          <div className="border-y border-dashed border-border/70 py-10 text-center text-sm text-muted-foreground">
            No cards yet.
          </div>
        ) : (
          <ol className="divide-y divide-border/60">
            {deck.cards.map((card, i) => {
              const isEditing = editingCardId === card.id;
              const badge = intervalBadge(card.intervalDays, card.lastReviewedAt);
              return (
                <li key={card.id} className="group relative py-5">
                  {isEditing ? (
                    <div className="space-y-3">
                      <CardEditor draft={draft} setDraft={setDraft} />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={saveEdit}
                          disabled={isPending}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingCardId(null)}
                        >
                          <X className="mr-1 h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-5">
                      <span className="mt-1 flex-none text-[11px] tabular-nums text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={badgeClass(badge.tone)}
                          >
                            {badge.label}
                          </Badge>
                          {card.type === "cloze" && (
                            <Badge
                              variant="secondary"
                              className="font-normal"
                            >
                              cloze
                            </Badge>
                          )}
                          {card.intervalDays > 0 && (
                            <span className="text-[11px] tabular-nums text-muted-foreground">
                              · {card.intervalDays}d interval
                            </span>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap text-[15px] font-medium leading-snug text-foreground">
                          {card.front}
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {card.back}
                        </p>
                      </div>
                      <div className="flex flex-none gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => beginEdit(card)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCard(card.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function CardEditor({
  draft,
  setDraft,
}: {
  draft: DraftCard;
  setDraft: (d: DraftCard) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={draft.type === "basic" ? "default" : "outline"}
          onClick={() => setDraft({ ...draft, type: "basic" })}
        >
          Basic
        </Button>
        <Button
          size="sm"
          variant={draft.type === "cloze" ? "default" : "outline"}
          onClick={() => setDraft({ ...draft, type: "cloze" })}
        >
          Cloze
        </Button>
      </div>
      <Textarea
        value={draft.front}
        onChange={(e) => setDraft({ ...draft, front: e.target.value })}
        placeholder={
          draft.type === "cloze"
            ? "The capital of France is {{c1::Paris}}"
            : "Front (question)"
        }
        rows={3}
      />
      <Textarea
        value={draft.back}
        onChange={(e) => setDraft({ ...draft, back: e.target.value })}
        placeholder="Back (answer / explanation)"
        rows={3}
      />
    </div>
  );
}
