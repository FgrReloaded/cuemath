import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { cards, decks } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PatchSchema = z.object({
  front: z.string().trim().min(1).max(2000).optional(),
  back: z.string().trim().min(1).max(4000).optional(),
  type: z.enum(["basic", "cloze"]).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(5).optional(),
});

async function ownedCard(userId: string, cardId: string) {
  const [row] = await db
    .select({ cardId: cards.id, deckId: decks.id })
    .from(cards)
    .innerJoin(decks, eq(decks.id, cards.deckId))
    .where(and(eq(cards.id, cardId), eq(decks.userId, userId)))
    .limit(1);
  return row;
}

async function authedUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await authedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const owned = await ownedCard(user.id, id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await db.transaction(async (tx) => {
    await tx.update(cards).set(parsed.data).where(eq(cards.id, id));
    await tx
      .update(decks)
      .set({ updatedAt: new Date() })
      .where(eq(decks.id, owned.deckId));
  });

  return NextResponse.json({ id });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await authedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const owned = await ownedCard(user.id, id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.transaction(async (tx) => {
    await tx.delete(cards).where(eq(cards.id, id));
    await tx
      .update(decks)
      .set({ updatedAt: new Date() })
      .where(eq(decks.id, owned.deckId));
  });

  return NextResponse.json({ ok: true });
}
