import { NextResponse } from "next/server";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { cards, decks } from "@/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const rows = await db
    .select({
      title: decks.title,
      description: decks.description,
      shareToken: decks.shareToken,
      createdAt: decks.createdAt,
      cardCount: sql<number>`count(distinct ${cards.id})`.as("card_count"),
    })
    .from(decks)
    .leftJoin(cards, eq(cards.deckId, decks.id))
    .where(eq(decks.isPublic, true))
    .groupBy(decks.id)
    .orderBy(desc(decks.createdAt));

  return NextResponse.json(
    rows.map((r) => ({
      title: r.title,
      description: r.description,
      shareToken: r.shareToken,
      cardCount: Number(r.cardCount ?? 0),
      createdAt: r.createdAt,
    })),
  );
}
