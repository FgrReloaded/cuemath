"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Globe,
  Link2,
  Lock,
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [deckDeleteOpen, setDeckDeleteOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<DeckDetailCard | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [isPublic, setIsPublic] = useState(deck.isPublic);
  const [shareToken, setShareToken] = useState(deck.shareToken);

  const refresh = () => startTransition(() => router.refresh());

  const shareUrl = shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/shared/${shareToken}`
    : null;

  async function enableSharing() {
    setSharing(true);
    try {
      const res = await fetch(`/api/decks/${deck.id}/share`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setShareToken(data.shareToken);
      setIsPublic(true);
      toast.success("Sharing enabled — link is ready");
    } catch {
      toast.error("Could not enable sharing");
    } finally {
      setSharing(false);
    }
  }

  async function disableSharing() {
    setSharing(true);
    try {
      const res = await fetch(`/api/decks/${deck.id}/share`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setIsPublic(false);
      toast.success("Sharing disabled");
    } catch {
      toast.error("Could not disable sharing");
    } finally {
      setSharing(false);
    }
  }

  function copyShareLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard");
  }

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
    const res = await fetch(`/api/decks/${deck.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete deck");
      return;
    }
    setDeckDeleteOpen(false);
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
    const res = await fetch(`/api/cards/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete card");
      return;
    }
    setCardToDelete(null);
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
                    onClick={() => setShareOpen(true)}
                    className="text-muted-foreground"
                  >
                    {isPublic ? (
                      <Globe className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Link2 className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {isPublic ? "Shared" : "Share"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeckDeleteOpen(true)}
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
                          onClick={() => setCardToDelete(card)}
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

      <ConfirmDialog
        open={deckDeleteOpen}
        onOpenChange={setDeckDeleteOpen}
        title="Delete this deck?"
        description={`"${deck.title}" and all ${deck.cards.length} card${
          deck.cards.length === 1 ? "" : "s"
        } will be removed. This can't be undone.`}
        confirmLabel="Delete deck"
        onConfirm={deleteDeck}
      />

      <ConfirmDialog
        open={cardToDelete !== null}
        onOpenChange={(v) => !v && setCardToDelete(null)}
        title="Delete this card?"
        description={
          cardToDelete
            ? cardToDelete.front.length > 120
              ? `${cardToDelete.front.slice(0, 120)}…`
              : cardToDelete.front
            : undefined
        }
        confirmLabel="Delete card"
        onConfirm={async () => {
          if (cardToDelete) await deleteCard(cardToDelete.id);
        }}
      />

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl tracking-tight">
              Share this deck
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
              Anyone with the link can view and import a copy into their own
              library.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card/40 px-4 py-3">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {isPublic ? "Public link active" : "Private"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {isPublic
                      ? "Visible in the community library"
                      : "Only you can see this deck"}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={isPublic ? "outline" : "default"}
                onClick={isPublic ? disableSharing : enableSharing}
                disabled={sharing}
              >
                {isPublic ? "Disable" : "Enable"}
              </Button>
            </div>

            {isPublic && shareUrl && (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Share link
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 truncate rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground">
                    {shareUrl}
                  </div>
                  <Button size="sm" variant="outline" onClick={copyShareLink}>
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
