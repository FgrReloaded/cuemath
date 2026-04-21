import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cards, decks } from "@/db/schema";
import { SharedDeckClient } from "./shared-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [deck] = await db
    .select({ title: decks.title })
    .from(decks)
    .where(and(eq(decks.shareToken, token), eq(decks.isPublic, true)))
    .limit(1);

  return {
    title: deck ? `${deck.title} · Mnemo` : "Shared Deck · Mnemo",
  };
}

export default async function SharedDeckPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [deck] = await db
    .select({
      id: decks.id,
      title: decks.title,
      description: decks.description,
      createdAt: decks.createdAt,
    })
    .from(decks)
    .where(and(eq(decks.shareToken, token), eq(decks.isPublic, true)))
    .limit(1);

  if (!deck) notFound();

  const rows = await db
    .select({
      front: cards.front,
      back: cards.back,
      type: cards.type,
      tags: cards.tags,
      position: cards.position,
    })
    .from(cards)
    .where(eq(cards.deckId, deck.id))
    .orderBy(asc(cards.position), asc(cards.createdAt));

  return (
    <SharedDeckClient
      token={token}
      deck={{
        title: deck.title,
        description: deck.description,
        createdAt: deck.createdAt.toISOString(),
        cards: rows.map((r) => ({
          front: r.front,
          back: r.back,
          type: r.type as "basic" | "cloze",
          tags: r.tags ?? [],
        })),
      }}
    />
  );
}
