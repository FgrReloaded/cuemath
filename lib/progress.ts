import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { reviewLog, reviews } from "@/db/schema";

const MATURE_THRESHOLD_DAYS = 21;

export type HeatmapDay = { date: string; count: number };

export type ProgressData = {
  streak: { current: number; longest: number };
  reviewsToday: number;
  reviewsWeek: number;
  reviewsTotal: number;
  retention30d: { total: number; correct: number; pct: number };
  maturityBreakdown: {
    new: number;
    learning: number;
    mature: number;
  };
  heatmap: HeatmapDay[];
};

export async function getProgress(userId: string): Promise<ProgressData> {
  const [
    dayRows,
    todayRow,
    weekRow,
    totalRow,
    retentionRow,
    maturityRow,
  ] = await Promise.all([
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${reviewLog.reviewedAt}), 'YYYY-MM-DD')`.as(
          "day",
        ),
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(reviewLog)
      .where(
        and(
          eq(reviewLog.userId, userId),
          sql`${reviewLog.reviewedAt} >= NOW() - INTERVAL '91 days'`,
        ),
      )
      .groupBy(sql`date_trunc('day', ${reviewLog.reviewedAt})`),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(reviewLog)
      .where(
        and(
          eq(reviewLog.userId, userId),
          sql`${reviewLog.reviewedAt} >= date_trunc('day', NOW())`,
        ),
      ),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(reviewLog)
      .where(
        and(
          eq(reviewLog.userId, userId),
          sql`${reviewLog.reviewedAt} >= NOW() - INTERVAL '7 days'`,
        ),
      ),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(reviewLog)
      .where(eq(reviewLog.userId, userId)),
    db
      .select({
        total: sql<number>`count(*)::int`,
        correct: sql<number>`count(*) filter (where ${reviewLog.rating} >= 2)::int`,
      })
      .from(reviewLog)
      .where(
        and(
          eq(reviewLog.userId, userId),
          sql`${reviewLog.reviewedAt} >= NOW() - INTERVAL '30 days'`,
        ),
      ),
    db
      .select({
        newCount: sql<number>`count(*) filter (where ${reviews.intervalDays} = 0)::int`,
        learning: sql<number>`count(*) filter (where ${reviews.intervalDays} > 0 and ${reviews.intervalDays} < ${MATURE_THRESHOLD_DAYS})::int`,
        mature: sql<number>`count(*) filter (where ${reviews.intervalDays} >= ${MATURE_THRESHOLD_DAYS})::int`,
      })
      .from(reviews)
      .where(eq(reviews.userId, userId)),
  ]);

  const byDay = new Map(dayRows.map((r) => [r.day, Number(r.count)]));
  const heatmap: HeatmapDay[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    heatmap.push({ date: key, count: byDay.get(key) ?? 0 });
  }

  let current = 0;
  for (let i = heatmap.length - 1; i >= 0; i--) {
    if (heatmap[i].count > 0) current++;
    else if (i === heatmap.length - 1) continue;
    else break;
  }
  let longest = 0;
  let run = 0;
  for (const d of heatmap) {
    if (d.count > 0) {
      run++;
      if (run > longest) longest = run;
    } else run = 0;
  }

  const retentionTotal = Number(retentionRow[0]?.total ?? 0);
  const retentionCorrect = Number(retentionRow[0]?.correct ?? 0);

  return {
    streak: { current, longest },
    reviewsToday: Number(todayRow[0]?.n ?? 0),
    reviewsWeek: Number(weekRow[0]?.n ?? 0),
    reviewsTotal: Number(totalRow[0]?.n ?? 0),
    retention30d: {
      total: retentionTotal,
      correct: retentionCorrect,
      pct: retentionTotal === 0 ? 0 : Math.round((retentionCorrect / retentionTotal) * 100),
    },
    maturityBreakdown: {
      new: Number(maturityRow[0]?.newCount ?? 0),
      learning: Number(maturityRow[0]?.learning ?? 0),
      mature: Number(maturityRow[0]?.mature ?? 0),
    },
    heatmap,
  };
}
