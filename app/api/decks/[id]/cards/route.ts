import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { cards, decks, reviews } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CreateSchema = z.object({
  front: z.string().trim().min(1).max(2000),
  back: z.string().trim().min(1).max(4000),
  type: z.enum(["basic", "cloze"]).default("basic"),
  tags: z.array(z.string().trim().min(1).max(40)).max(5).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: deckId } = await params;

  const [deck] = await db
    .select({ id: decks.id })
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, user.id)))
    .limit(1);
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [last] = await tx
        .select({ position: cards.position })
        .from(cards)
        .where(eq(cards.deckId, deckId))
        .orderBy(desc(cards.position))
        .limit(1);
      const nextPos = (last?.position ?? -1) + 1;

      const [card] = await tx
        .insert(cards)
        .values({
          deckId,
          front: parsed.data.front,
          back: parsed.data.back,
          type: parsed.data.type,
          tags: parsed.data.tags ?? [],
          position: nextPos,
        })
        .returning({ id: cards.id });

      await tx.insert(reviews).values({
        cardId: card.id,
        userId: user.id,
        nextReviewAt: new Date(),
      });

      await tx
        .update(decks)
        .set({ updatedAt: new Date() })
        .where(eq(decks.id, deckId));

      return card.id;
    });

    return NextResponse.json({ id: result }, { status: 201 });
  } catch (err) {
    console.error("Card create failed", err);
    return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
  }
}
