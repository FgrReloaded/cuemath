export default function DeckLoading() {
  return (
    <div className="space-y-14">
      <div>
        <Shim className="mb-6 h-3 w-16 rounded-full" />
        <section className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-8 space-y-5">
            <Shim className="h-3 w-28 rounded-full" delay={40} />
            <div className="space-y-2">
              <Shim className="h-[44px] w-3/4 rounded-lg" delay={100} />
              <Shim className="h-[44px] w-1/2 rounded-lg" delay={160} />
            </div>
            <Shim className="h-4 w-2/3 rounded-full" delay={240} />
            <div className="flex gap-2 pt-1">
              <Shim className="h-9 w-24 rounded-md" delay={300} />
              <Shim className="h-9 w-20 rounded-md" delay={340} />
              <Shim className="h-9 w-24 rounded-md" delay={380} />
            </div>
          </div>
          <aside className="md:col-span-4 md:pt-6">
            <div className="space-y-4 border-l border-border/60 pl-6">
              <Shim className="h-2.5 w-12 rounded-full" />
              <Shim className="h-8 w-16 rounded-md" delay={80} />
              <Shim className="h-1.5 w-full rounded-full" delay={140} />
              <div className="space-y-1.5 pt-1">
                <Shim className="h-3 w-24 rounded-full" delay={200} />
                <Shim className="h-3 w-28 rounded-full" delay={240} />
                <Shim className="h-3 w-20 rounded-full" delay={280} />
              </div>
            </div>
          </aside>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between border-b border-border/70 pb-3">
          <div className="space-y-2">
            <Shim className="h-3 w-24 rounded-full" />
            <Shim className="h-5 w-28 rounded-md" delay={60} />
          </div>
          <Shim className="h-8 w-24 rounded-md" delay={120} />
        </div>
        <ol className="divide-y divide-border/60">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex items-start gap-5 py-5">
              <Shim className="mt-1 h-3 w-6 rounded-full" delay={i * 60} />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Shim
                    className="h-5 w-16 rounded-md"
                    delay={i * 60 + 30}
                  />
                  <Shim
                    className="h-5 w-12 rounded-md"
                    delay={i * 60 + 60}
                  />
                </div>
                <Shim
                  className="h-4 w-3/4 rounded-md"
                  delay={i * 60 + 90}
                />
                <Shim
                  className="h-3 w-5/6 rounded-full"
                  delay={i * 60 + 130}
                />
                <Shim
                  className="h-3 w-2/3 rounded-full"
                  delay={i * 60 + 170}
                />
              </div>
            </li>
          ))}
        </ol>
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
