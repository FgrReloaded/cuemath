import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cards, decks, reviews } from "@/db/schema";

export type DeckDetailCard = {
  id: string;
  front: string;
  back: string;
  type: "basic" | "cloze";
  tags: string[];
  position: number;
  nextReviewAt: Date | null;
  intervalDays: number;
  lastReviewedAt: Date | null;
};

export type DeckDetail = {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  cards: DeckDetailCard[];
};

export async function getDeckDetail(
  userId: string,
  deckId: string,
): Promise<DeckDetail | null> {
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .limit(1);
  if (!deck) return null;

  const rows = await db
    .select({
      id: cards.id,
      front: cards.front,
      back: cards.back,
      type: cards.type,
      tags: cards.tags,
      position: cards.position,
      nextReviewAt: reviews.nextReviewAt,
      intervalDays: reviews.intervalDays,
      lastReviewedAt: reviews.lastReviewedAt,
    })
    .from(cards)
    .leftJoin(reviews, eq(reviews.cardId, cards.id))
    .where(eq(cards.deckId, deckId))
    .orderBy(asc(cards.position), asc(cards.createdAt));

  return {
    id: deck.id,
    title: deck.title,
    description: deck.description,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
    cards: rows.map((r) => ({
      id: r.id,
      front: r.front,
      back: r.back,
      type: r.type as "basic" | "cloze",
      tags: r.tags ?? [],
      position: r.position,
      nextReviewAt: r.nextReviewAt,
      intervalDays: r.intervalDays ?? 0,
      lastReviewedAt: r.lastReviewedAt,
    })),
  };
}
