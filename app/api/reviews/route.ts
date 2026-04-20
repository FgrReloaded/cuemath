import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { reviewLog, reviews } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { type Rating, formatInterval, schedule } from "@/lib/sm2";

export const runtime = "nodejs";

const BodySchema = z.object({
  cardId: z.string().uuid(),
  rating: z.number().int().min(0).max(3),
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

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { cardId, rating } = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(reviews)
        .where(and(eq(reviews.cardId, cardId), eq(reviews.userId, user.id)))
        .limit(1);
      if (!current) throw new Error("Review not found");

      const next = schedule(
        {
          easeFactor: current.easeFactor,
          intervalDays: current.intervalDays,
          repetitions: current.repetitions,
          lapses: current.lapses,
        },
        rating as Rating,
      );
      const now = new Date();

      await tx
        .update(reviews)
        .set({
          easeFactor: next.easeFactor,
          intervalDays: next.intervalDays,
          repetitions: next.repetitions,
          lapses: next.lapses,
          lastRating: rating,
          lastReviewedAt: now,
          nextReviewAt: next.nextReviewAt,
        })
        .where(eq(reviews.id, current.id));

      await tx.insert(reviewLog).values({
        cardId: current.cardId,
        userId: user.id,
        rating,
        prevInterval: current.intervalDays,
        newInterval: next.intervalDays,
        prevEase: current.easeFactor,
        newEase: next.easeFactor,
        reviewedAt: now,
      });

      return {
        nextReviewAt: next.nextReviewAt.toISOString(),
        intervalLabel: formatInterval(next.intervalDays),
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Review submit failed", err);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 },
    );
  }
}
