"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DeckDetail, DeckDetailCard } from "@/lib/decks";

type DraftCard = {
  front: string;
  back: string;
  type: "basic" | "cloze";
};

function intervalBadge(days: number, lastReviewedAt: Date | null) {
  if (!lastReviewedAt) return { label: "New", tone: "neutral" as const };
  if (days >= 21) return { label: "Mature", tone: "good" as const };
  if (days > 0) return { label: "Learning", tone: "warn" as const };
  return { label: "Relearning", tone: "bad" as const };
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
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link href="/">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-2">
            {editingHeader ? (
              <div className="space-y-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-semibold"
                />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
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
                <h1 className="text-3xl font-semibold tracking-tight">
                  {deck.title}
                </h1>
                {deck.description && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {deck.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span>{deck.cards.length} cards</span>
                  <span>·</span>
                  <span>
                    Updated{" "}
                    {new Date(deck.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </>
            )}
          </div>

          {!editingHeader && (
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={`/study?deck=${deck.id}`}>
                  <Play className="mr-1.5 h-3.5 w-3.5" />
                  Study
                </Link>
              </Button>
              <Button variant="outline" onClick={() => setEditingHeader(true)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={deleteDeck}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Cards
          </h2>
          {!adding && !editingCardId && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAdding(true);
                setDraft({ front: "", back: "", type: "basic" });
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add card
            </Button>
          )}
        </div>

        {adding && (
          <Card className="border-dashed">
            <CardContent className="space-y-3 p-4">
              <CardEditor draft={draft} setDraft={setDraft} />
              <div className="flex gap-2">
                <Button size="sm" onClick={addCard} disabled={isPending}>
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAdding(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {deck.cards.length === 0 && !adding ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-zinc-500">
              No cards yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {deck.cards.map((card) => {
              const isEditing = editingCardId === card.id;
              const badge = intervalBadge(card.intervalDays, card.lastReviewedAt);
              return (
                <Card key={card.id}>
                  <CardContent className="p-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <CardEditor draft={draft} setDraft={setDraft} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit} disabled={isPending}>
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCardId(null)}
                          >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                badge.tone === "good"
                                  ? "border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-400"
                                  : badge.tone === "warn"
                                    ? "border-amber-200 text-amber-700 dark:border-amber-900 dark:text-amber-400"
                                    : badge.tone === "bad"
                                      ? "border-red-200 text-red-700 dark:border-red-900 dark:text-red-400"
                                      : ""
                              }
                            >
                              {badge.label}
                            </Badge>
                            {card.type === "cloze" && (
                              <Badge variant="secondary" className="font-normal">
                                cloze
                              </Badge>
                            )}
                          </div>
                          <p className="whitespace-pre-wrap text-sm font-medium">
                            {card.front}
                          </p>
                          <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                            {card.back}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => beginEdit(card)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteCard(card.id)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
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
