import { BookOpen, Target, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Heatmap } from "@/components/heatmap";
import { AnimatedFlame } from "@/components/animated-flame";
import { StatValue } from "@/components/stat-value";
import { getProgress } from "@/lib/progress";
import { requireUser } from "@/lib/supabase/guards";

export const metadata = { title: "Stats · Mnemo" };

function streakHeadline(current: number, longest: number) {
  if (current === 0) {
    return {
      eyebrow: "Progress",
      title: longest > 0 ? "Ready to rebuild that streak" : "Start your streak today",
      sub:
        longest > 0
          ? `Your longest run was ${longest} day${longest === 1 ? "" : "s"}. Back on the horse?`
          : "One review today is all it takes.",
    };
  }
  if (current === 1) {
    return {
      eyebrow: "Day 1",
      title: "Streak started",
      sub: "The hardest day is tomorrow. Don't break it.",
    };
  }
  if (current < 7) {
    return {
      eyebrow: "Progress",
      title: `${current}-day streak`,
      sub: `${7 - current} more day${7 - current === 1 ? "" : "s"} to a full week.`,
    };
  }
  if (current < 30) {
    return {
      eyebrow: "A week in",
      title: `${current}-day streak`,
      sub: "This is the part where it becomes a habit.",
    };
  }
  if (current < 100) {
    return {
      eyebrow: "A month+",
      title: `${current}-day streak`,
      sub: "Most people never make it here. You did.",
    };
  }
  return {
    eyebrow: "Legendary",
    title: `${current}-day streak`,
    sub: "Consider this your new baseline. Remarkable.",
  };
}

function StatBlock({
  label,
  children,
  sub,
  icon,
}: {
  label: string;
  children: React.ReactNode;
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
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {children}
          </p>
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
  delayMs = 0,
}: {
  label: string;
  value: number;
  total: number;
  tone: "new" | "learning" | "mature";
  delayMs?: number;
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
          className={`h-full rounded-full ${barClass}`}
          style={{
            width: `${pct}%`,
            transition: `width 900ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delayMs}ms`,
          }}
        />
      </div>
    </div>
  );
}

export default async function StatsPage() {
  const user = await requireUser();
  const p = await getProgress(user.id);
  const totalCards =
    p.maturityBreakdown.new +
    p.maturityBreakdown.learning +
    p.maturityBreakdown.mature;

  const h = streakHeadline(p.streak.current, p.streak.longest);
  const heatmapTotal = p.heatmap.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30">
          <AnimatedFlame active={p.streak.current > 0} size={24} />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm text-zinc-500">{h.eyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{h.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{h.sub}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBlock
          label="Current streak"
          sub={`Longest: ${p.streak.longest}`}
          icon={<AnimatedFlame active={p.streak.current > 0} size={20} />}
        >
          <StatValue value={p.streak.current} />
        </StatBlock>
        <StatBlock
          label="Reviews today"
          sub={`${p.reviewsWeek} this week`}
          icon={<TrendingUp className="h-5 w-5" />}
        >
          <StatValue value={p.reviewsToday} />
        </StatBlock>
        <StatBlock
          label="Recall (30d)"
          sub={`${p.retention30d.correct} / ${p.retention30d.total} correct`}
          icon={<Target className="h-5 w-5" />}
        >
          <StatValue value={p.retention30d.pct} suffix="%" />
        </StatBlock>
        <StatBlock
          label="Total reviews"
          icon={<BookOpen className="h-5 w-5" />}
        >
          <StatValue value={p.reviewsTotal} duration={1200} />
        </StatBlock>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Last 13 weeks
            </h2>
            <span className="text-xs text-zinc-500 tabular-nums">
              <StatValue value={heatmapTotal} /> reviews
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
                delayMs={100}
              />
              <MaturityBar
                label="Learning"
                value={p.maturityBreakdown.learning}
                total={totalCards}
                tone="learning"
                delayMs={200}
              />
              <MaturityBar
                label="New"
                value={p.maturityBreakdown.new}
                total={totalCards}
                tone="new"
                delayMs={300}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
