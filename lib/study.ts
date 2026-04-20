import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { cards, decks, reviews } from "@/db/schema";

export type DueCard = {
  cardId: string;
  reviewId: string;
  front: string;
  back: string;
  type: "basic" | "cloze";
  deckId: string;
  deckTitle: string;
};

export async function getDueCards(
  userId: string,
  deckId?: string,
  limit = 100,
): Promise<DueCard[]> {
  const now = new Date();

  const rows = await db
    .select({
      cardId: cards.id,
      reviewId: reviews.id,
      front: cards.front,
      back: cards.back,
      type: cards.type,
      deckId: decks.id,
      deckTitle: decks.title,
    })
    .from(reviews)
    .innerJoin(cards, eq(cards.id, reviews.cardId))
    .innerJoin(decks, eq(decks.id, cards.deckId))
    .where(
      and(
        eq(reviews.userId, userId),
        lte(reviews.nextReviewAt, now),
        deckId ? eq(decks.id, deckId) : undefined,
      ),
    )
    .orderBy(
      sql`${reviews.lastReviewedAt} asc nulls first`,
      sql`${reviews.nextReviewAt} asc`,
    )
    .limit(limit);

  return rows.map((r) => ({
    cardId: r.cardId,
    reviewId: r.reviewId,
    front: r.front,
    back: r.back,
    type: r.type as "basic" | "cloze",
    deckId: r.deckId,
    deckTitle: r.deckTitle,
  }));
}
