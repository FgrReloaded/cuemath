export default function StatsLoading() {
  return (
    <div className="space-y-20">
      <section className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-7 space-y-6">
          <div className="flex items-center gap-3">
            <Shim className="h-9 w-9 flex-none rounded-full" />
            <Shim className="h-3 w-24 rounded-full" delay={60} />
          </div>
          <div className="flex items-start gap-4">
            <Shim className="h-[130px] w-[170px] rounded-lg" delay={120} />
            <Shim className="mt-4 h-8 w-10 rounded-md" delay={180} />
          </div>
          <Shim className="h-4 w-72 rounded-full" delay={240} />
        </div>

        <aside className="md:col-span-5 md:pt-14">
          <div className="space-y-7 border-l border-border/60 pl-6 md:pl-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Shim className="h-2.5 w-28 rounded-full" delay={i * 70} />
                <Shim className="h-9 w-24 rounded-md" delay={i * 70 + 40} />
                <Shim className="h-2.5 w-20 rounded-full" delay={i * 70 + 80} />
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between border-b border-border/70 pb-3">
          <div className="space-y-2">
            <Shim className="h-3 w-24 rounded-full" />
            <Shim className="h-5 w-20 rounded-md" delay={60} />
          </div>
          <Shim className="h-3 w-40 rounded-full" delay={120} />
        </div>
        <div className="flex gap-[3px] pt-2">
          {Array.from({ length: 13 }).map((_, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, d) => (
                <div
                  key={d}
                  className="h-[11px] w-[11px] animate-pulse rounded-sm bg-zinc-200/70 dark:bg-zinc-800/70"
                  style={{ animationDelay: `${(w + d) * 14}ms` }}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between border-b border-border/70 pb-3">
          <div className="space-y-2">
            <Shim className="h-3 w-24 rounded-full" />
            <Shim className="h-5 w-32 rounded-md" delay={60} />
          </div>
        </div>
        <Shim className="h-2.5 w-full rounded-full" delay={100} />
        <div className="flex gap-5">
          <Shim className="h-3 w-20 rounded-full" delay={140} />
          <Shim className="h-3 w-20 rounded-full" delay={180} />
          <Shim className="h-3 w-20 rounded-full" delay={220} />
        </div>
      </section>
    </div>
  );
}

function Shim({
  className = "",
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`animate-pulse bg-zinc-200/70 dark:bg-zinc-800/70 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
