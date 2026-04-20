import type { HeatmapDay } from "@/lib/progress";

function intensity(count: number, max: number): number {
  if (count === 0) return 0;
  if (max <= 1) return 4;
  const ratio = count / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

const LEVELS = [
  "bg-zinc-100 dark:bg-zinc-900",
  "bg-emerald-200 dark:bg-emerald-950/60",
  "bg-emerald-300 dark:bg-emerald-900/80",
  "bg-emerald-500 dark:bg-emerald-700",
  "bg-emerald-600 dark:bg-emerald-500",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function Heatmap({ days }: { days: HeatmapDay[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));

  const firstDay = new Date(days[0].date);
  const leadingEmpty = firstDay.getDay();
  const padded: (HeatmapDay | null)[] = [
    ...Array.from({ length: leadingEmpty }, () => null),
    ...days,
  ];
  const weeks: (HeatmapDay | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  const monthLabels: { weekIdx: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wIdx) => {
    const firstReal = week.find((d): d is HeatmapDay => d !== null);
    if (!firstReal) return;
    const m = new Date(firstReal.date).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ weekIdx: wIdx, label: MONTHS[m] });
      lastMonth = m;
    }
  });

  return (
    <div className="space-y-2">
      <div className="flex gap-[3px] pl-6 text-[10px] text-zinc-500">
        {weeks.map((_, wIdx) => {
          const label = monthLabels.find((m) => m.weekIdx === wIdx);
          return (
            <div key={wIdx} className="w-[11px] text-left">
              {label ? label.label : ""}
            </div>
          );
        })}
      </div>

      <div className="flex gap-[3px]">
        <div className="flex flex-col gap-[3px] pr-1 text-[10px] text-zinc-500">
          <div className="h-[11px]" />
          <div className="h-[11px] leading-[11px]">Mon</div>
          <div className="h-[11px]" />
          <div className="h-[11px] leading-[11px]">Wed</div>
          <div className="h-[11px]" />
          <div className="h-[11px] leading-[11px]">Fri</div>
          <div className="h-[11px]" />
        </div>
        <div className="flex gap-[3px]">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, dIdx) => {
                const day = week[dIdx];
                if (!day) {
                  return (
                    <div key={dIdx} className="h-[11px] w-[11px] rounded-sm bg-transparent" />
                  );
                }
                const level = intensity(day.count, max);
                const dateLabel = new Date(day.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                });
                return (
                  <div
                    key={dIdx}
                    title={`${dateLabel}: ${day.count} review${day.count === 1 ? "" : "s"}`}
                    className={`h-[11px] w-[11px] rounded-sm ${LEVELS[level]}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1 text-[10px] text-zinc-500">
        <span>Less</span>
        {LEVELS.map((cls, i) => (
          <div key={i} className={`h-[11px] w-[11px] rounded-sm ${cls}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
