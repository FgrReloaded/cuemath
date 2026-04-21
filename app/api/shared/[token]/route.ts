import { NextResponse, type NextRequest } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cards, decks } from "@/db/schema";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
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

  if (!deck) {
    return NextResponse.json(
      { error: "Deck not found or no longer shared" },
      { status: 404 },
    );
  }

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

  return NextResponse.json({
    title: deck.title,
    description: deck.description,
    cardCount: rows.length,
    createdAt: deck.createdAt,
    cards: rows.map((r) => ({
      front: r.front,
      back: r.back,
      type: r.type,
      tags: r.tags ?? [],
    })),
  });
}
