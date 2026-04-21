import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cards as cardsTable, decks, reviews } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await params;

  const [sourceDeck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.shareToken, token), eq(decks.isPublic, true)))
    .limit(1);

  if (!sourceDeck) {
    return NextResponse.json(
      { error: "Deck not found or no longer shared" },
      { status: 404 },
    );
  }

  const sourceCards = await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.deckId, sourceDeck.id))
    .orderBy(asc(cardsTable.position), asc(cardsTable.createdAt));

  if (sourceCards.length === 0) {
    return NextResponse.json(
      { error: "This deck has no cards" },
      { status: 422 },
    );
  }

  const now = new Date();

  try {
    const deckId = await db.transaction(async (tx) => {
      const [newDeck] = await tx
        .insert(decks)
        .values({
          userId: user.id,
          title: sourceDeck.title,
          description: sourceDeck.description,
          sourceFilename: sourceDeck.sourceFilename,
        })
        .returning({ id: decks.id });

      const insertedCards = await tx
        .insert(cardsTable)
        .values(
          sourceCards.map((c, i) => ({
            deckId: newDeck.id,
            front: c.front,
            back: c.back,
            type: c.type,
            tags: c.tags ?? [],
            sourceChunk: c.sourceChunk,
            position: i,
          })),
        )
        .returning({ id: cardsTable.id });

      await tx.insert(reviews).values(
        insertedCards.map((c) => ({
          cardId: c.id,
          userId: user.id,
          nextReviewAt: now,
        })),
      );

      return newDeck.id;
    });

    return NextResponse.json({ id: deckId }, { status: 201 });
  } catch (err) {
    console.error("Import failed", err);
    return NextResponse.json(
      { error: "Failed to import deck" },
      { status: 500 },
    );
  }
}
