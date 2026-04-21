import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { decks } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function generateToken() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

async function authedUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await authedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [deck] = await db
    .select({ id: decks.id, shareToken: decks.shareToken })
    .from(decks)
    .where(and(eq(decks.id, id), eq(decks.userId, user.id)))
    .limit(1);
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const token = deck.shareToken ?? generateToken();

  await db
    .update(decks)
    .set({ isPublic: true, shareToken: token, updatedAt: new Date() })
    .where(eq(decks.id, id));

  return NextResponse.json({ shareToken: token, isPublic: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await authedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [row] = await db
    .update(decks)
    .set({ isPublic: false, updatedAt: new Date() })
    .where(and(eq(decks.id, id), eq(decks.userId, user.id)))
    .returning({ id: decks.id });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ isPublic: false });
}
