import { Heatmap } from "@/components/heatmap";
import { AnimatedFlame } from "@/components/animated-flame";
import { StatValue } from "@/components/stat-value";
import { MemoryBar } from "@/components/memory-bar";
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

function InlineStat({
  label,
  children,
  sub,
}: {
  label: string;
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="text-[2rem] font-medium leading-none tracking-tight tabular-nums text-foreground">
        {children}
      </p>
      {sub && (
        <p className="text-[11px] tabular-nums text-muted-foreground">{sub}</p>
      )}
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
  const activeDays = p.heatmap.filter((d) => d.count > 0).length;
  const pctDays = p.heatmap.length
    ? Math.round((activeDays / p.heatmap.length) * 100)
    : 0;

  return (
    <div className="space-y-20">
      <section className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-7 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-100/70 dark:bg-amber-950/40">
              <AnimatedFlame active={p.streak.current > 0} size={18} />
            </div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {h.eyebrow}
            </p>
          </div>

          <div className="flex items-start gap-4">
            <span className="font-sans text-[clamp(5rem,14vw,10rem)] font-medium leading-[0.82] tracking-[-0.05em] text-foreground tabular-nums">
              {p.streak.current}
            </span>
            <span className="mt-4 text-sm leading-tight tracking-tight text-muted-foreground">
              day
              <br />
              streak
            </span>
          </div>

          <p className="max-w-md text-[15px] text-muted-foreground">{h.sub}</p>
        </div>

        <aside className="md:col-span-5 md:pt-14">
          <div className="space-y-6 border-l border-border/60 pl-6 md:pl-8">
            <InlineStat
              label="Reviews today"
              sub={`${p.reviewsWeek} this week`}
            >
              <StatValue value={p.reviewsToday} />
            </InlineStat>
            <InlineStat
              label="Recall · 30 days"
              sub={`${p.retention30d.correct} / ${p.retention30d.total} correct`}
            >
              <StatValue value={p.retention30d.pct} suffix="%" />
            </InlineStat>
            <InlineStat
              label="Longest streak"
              sub={p.streak.longest > 0 ? `${p.streak.longest} days` : undefined}
            >
              <StatValue value={p.streak.longest} />
            </InlineStat>
            <InlineStat label="Lifetime reviews">
              <StatValue value={p.reviewsTotal} duration={1200} />
            </InlineStat>
          </div>
        </aside>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between border-b border-border/70 pb-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Last 13 weeks
            </p>
            <h2 className="mt-1 text-xl font-medium tracking-tight">Activity</h2>
          </div>
          <div className="flex items-baseline gap-4 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <span>
              <span className="tabular-nums text-foreground normal-case tracking-normal">
                <StatValue value={heatmapTotal} />
              </span>{" "}
              reviews
            </span>
            <span className="h-3 w-px bg-border/70" />
            <span>
              <span className="tabular-nums text-foreground normal-case tracking-normal">
                {activeDays}
              </span>{" "}
              active days · {pctDays}%
            </span>
          </div>
        </div>
        <div className="overflow-x-auto pb-1">
          <Heatmap days={p.heatmap} />
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between border-b border-border/70 pb-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Composition
            </p>
            <h2 className="mt-1 text-xl font-medium tracking-tight">
              Memory graph
            </h2>
          </div>
          {totalCards > 0 && (
            <p className="text-[11px] tabular-nums uppercase tracking-[0.14em] text-muted-foreground">
              <span className="text-foreground normal-case tracking-normal">
                {totalCards}
              </span>{" "}
              total cards
            </p>
          )}
        </div>

        {totalCards === 0 ? (
          <p className="text-sm text-muted-foreground">
            No cards yet — upload a PDF to get started.
          </p>
        ) : (
          <div className="space-y-6 pt-2">
            <MemoryBar
              mature={p.maturityBreakdown.mature}
              learning={p.maturityBreakdown.learning}
              fresh={p.maturityBreakdown.new}
            />
            <p className="max-w-xl text-sm text-muted-foreground">
              Mature cards are past the 21-day interval — they&apos;re sticking.
              Learning cards are still climbing. New cards are waiting for their
              first round.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
