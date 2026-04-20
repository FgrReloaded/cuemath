import { BookOpen, Flame, Target, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Heatmap } from "@/components/heatmap";
import { getProgress } from "@/lib/progress";
import { requireUser } from "@/lib/supabase/guards";

export const metadata = { title: "Stats · Mnemo" };

function StatBlock({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {label}
          </p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          {sub && <p className="text-xs text-zinc-500">{sub}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function MaturityBar({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "new" | "learning" | "mature";
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  const barClass =
    tone === "mature"
      ? "bg-emerald-500 dark:bg-emerald-600"
      : tone === "learning"
        ? "bg-amber-400 dark:bg-amber-600"
        : "bg-zinc-400 dark:bg-zinc-600";
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
        <span className="tabular-nums text-zinc-500">
          {value} <span className="text-zinc-400">· {pct}%</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function StatsPage() {
  const user = await requireUser();
  const p = await getProgress(user.id);
  const totalCards =
    p.maturityBreakdown.new + p.maturityBreakdown.learning + p.maturityBreakdown.mature;

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <p className="text-sm text-zinc-500">Progress</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {p.streak.current > 0
            ? `${p.streak.current}-day streak`
            : "Start your streak today"}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBlock
          label="Current streak"
          value={p.streak.current}
          sub={`Longest: ${p.streak.longest}`}
          icon={<Flame className="h-5 w-5" />}
        />
        <StatBlock
          label="Reviews today"
          value={p.reviewsToday}
          sub={`${p.reviewsWeek} this week`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatBlock
          label="Recall (30d)"
          value={`${p.retention30d.pct}%`}
          sub={`${p.retention30d.correct} / ${p.retention30d.total} correct`}
          icon={<Target className="h-5 w-5" />}
        />
        <StatBlock
          label="Total reviews"
          value={p.reviewsTotal}
          icon={<BookOpen className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Last 13 weeks
            </h2>
            <span className="text-xs text-zinc-500">
              {p.heatmap.reduce((s, d) => s + d.count, 0)} reviews
            </span>
          </div>
          <Heatmap days={p.heatmap} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 p-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Card maturity
          </h2>
          {totalCards === 0 ? (
            <p className="text-sm text-zinc-500">
              No cards yet — upload a PDF to get started.
            </p>
          ) : (
            <div className="space-y-3">
              <MaturityBar
                label="Mature"
                value={p.maturityBreakdown.mature}
                total={totalCards}
                tone="mature"
              />
              <MaturityBar
                label="Learning"
                value={p.maturityBreakdown.learning}
                total={totalCards}
                tone="learning"
              />
              <MaturityBar
                label="New"
                value={p.maturityBreakdown.new}
                total={totalCards}
                tone="new"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
