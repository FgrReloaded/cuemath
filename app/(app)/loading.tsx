export default function Loading() {
  return (
    <div className="space-y-20">
      <section className="grid gap-10 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-8 space-y-6">
          <Shim className="h-3 w-40 rounded-full" />
          <div className="space-y-3">
            <Shim className="h-[72px] w-[280px] rounded-lg" delay={80} />
            <Shim className="h-[72px] w-[200px] rounded-lg" delay={140} />
          </div>
          <Shim className="h-3 w-72 rounded-full" delay={220} />
          <Shim className="h-11 w-44 rounded-md" delay={300} />
        </div>
        <aside className="md:col-span-4 md:col-start-9 md:pt-2">
          <div className="space-y-5 border-l border-border/60 pl-6">
            <Shim className="h-3 w-28 rounded-full" />
            <Shim className="h-9 w-20 rounded-md" delay={80} />
            <Shim className="h-2.5 w-full rounded-full" delay={160} />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Shim className="h-10 rounded-md" delay={220} />
              <Shim className="h-10 rounded-md" delay={260} />
            </div>
          </div>
        </aside>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between border-b border-border/70 pb-4">
          <div className="space-y-2">
            <Shim className="h-3 w-12 rounded-full" />
            <Shim className="h-5 w-28 rounded-md" delay={60} />
          </div>
          <Shim className="h-8 w-24 rounded-md" delay={120} />
        </div>
        <div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-5 border-b border-border/60 py-5"
            >
              <Shim
                className="h-12 w-12 flex-none rounded-full"
                delay={i * 70}
              />
              <div className="flex-1 space-y-2">
                <Shim
                  className="h-4 w-1/2 rounded-md"
                  delay={i * 70 + 40}
                />
                <Shim
                  className="h-3 w-2/3 rounded-full"
                  delay={i * 70 + 90}
                />
                <Shim
                  className="h-3 w-1/3 rounded-full"
                  delay={i * 70 + 140}
                />
              </div>
            </div>
          ))}
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
