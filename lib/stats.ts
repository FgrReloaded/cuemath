import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { cards, decks, reviews } from "@/db/schema";
import { db } from "@/db";

const MATURE_THRESHOLD_DAYS = 21;

export type DashboardStats = {
  deckCount: number;
  cardCount: number;
  dueNow: number;
  mastered: number;
  learning: number;
};

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const now = new Date();

  const [deckRow, cardRow, dueRow, masteredRow, learningRow] = await Promise.all([
    db.select({ n: count() }).from(decks).where(eq(decks.userId, userId)),
    db
      .select({ n: count() })
      .from(cards)
      .innerJoin(decks, eq(decks.id, cards.deckId))
      .where(eq(decks.userId, userId)),
    db
      .select({ n: count() })
      .from(reviews)
      .where(and(eq(reviews.userId, userId), lte(reviews.nextReviewAt, now))),
    db
      .select({ n: count() })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          gte(reviews.intervalDays, MATURE_THRESHOLD_DAYS),
        ),
      ),
    db
      .select({ n: count() })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          sql`${reviews.intervalDays} > 0`,
          sql`${reviews.intervalDays} < ${MATURE_THRESHOLD_DAYS}`,
        ),
      ),
  ]);

  return {
    deckCount: Number(deckRow[0]?.n ?? 0),
    cardCount: Number(cardRow[0]?.n ?? 0),
    dueNow: Number(dueRow[0]?.n ?? 0),
    mastered: Number(masteredRow[0]?.n ?? 0),
    learning: Number(learningRow[0]?.n ?? 0),
  };
}

export type DeckSummary = {
  id: string;
  title: string;
  description: string | null;
  cardCount: number;
  dueNow: number;
  updatedAt: Date;
};

export async function getUserDecks(userId: string): Promise<DeckSummary[]> {
  const now = new Date();
  const rows = await db
    .select({
      id: decks.id,
      title: decks.title,
      description: decks.description,
      updatedAt: decks.updatedAt,
      cardCount: sql<number>`count(distinct ${cards.id})`.as("card_count"),
      dueNow: sql<number>`count(distinct ${cards.id}) filter (where ${reviews.nextReviewAt} <= ${now})`.as(
        "due_now",
      ),
    })
    .from(decks)
    .leftJoin(cards, eq(cards.deckId, decks.id))
    .leftJoin(reviews, eq(reviews.cardId, cards.id))
    .where(eq(decks.userId, userId))
    .groupBy(decks.id)
    .orderBy(sql`${decks.updatedAt} desc`);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    cardCount: Number(r.cardCount ?? 0),
    dueNow: Number(r.dueNow ?? 0),
    updatedAt: r.updatedAt,
  }));
}
