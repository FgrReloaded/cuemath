import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { cards as cardsTable, decks, reviews } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SaveDeckSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  sourceFilename: z.string().max(500).optional(),
  cards: z
    .array(
      z.object({
        front: z.string().trim().min(1).max(2000),
        back: z.string().trim().min(1).max(4000),
        type: z.enum(["basic", "cloze"]).default("basic"),
        tags: z.array(z.string().trim().min(1).max(40)).max(5).optional(),
      }),
    )
    .min(1)
    .max(200),
});

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SaveDeckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { title, description, sourceFilename, cards } = parsed.data;
  const now = new Date();

  try {
    const deckId = await db.transaction(async (tx) => {
      const [deck] = await tx
        .insert(decks)
        .values({
          userId: user.id,
          title,
          description: description ?? null,
          sourceFilename: sourceFilename ?? null,
        })
        .returning({ id: decks.id });

      const insertedCards = await tx
        .insert(cardsTable)
        .values(
          cards.map((c, i) => ({
            deckId: deck.id,
            front: c.front,
            back: c.back,
            type: c.type,
            tags: c.tags ?? [],
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

      return deck.id;
    });

    return NextResponse.json({ id: deckId }, { status: 201 });
  } catch (err) {
    console.error("Deck save failed", err);
    return NextResponse.json(
      { error: "Failed to save deck" },
      { status: 500 },
    );
  }
}
