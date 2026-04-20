export default function StudyLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
      <header className="mb-10 space-y-4">
        <div className="flex items-center justify-between">
          <Shim className="h-3 w-16 rounded-full" />
          <Shim className="h-3 w-32 rounded-full" delay={60} />
          <Shim className="h-3 w-12 rounded-full" delay={120} />
        </div>
        <div className="relative h-px w-full bg-border/70">
          <div
            className="absolute inset-y-[-1px] left-0 h-[3px] w-1/4 animate-pulse rounded-full bg-zinc-300/70 dark:bg-zinc-700/70"
            style={{ animationDelay: "160ms" }}
          />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center min-h-[380px]">
        <div
          className="relative flex min-h-[380px] w-full animate-pulse flex-col justify-between rounded-[20px] border border-border/70 bg-card p-10"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex items-center justify-between">
            <Shim className="h-2.5 w-16 rounded-full" delay={100} />
            <Shim className="h-2.5 w-20 rounded-full" delay={140} />
          </div>
          <div className="flex flex-col items-center gap-3 py-8">
            <Shim className="h-6 w-3/4 rounded-md" delay={200} />
            <Shim className="h-6 w-1/2 rounded-md" delay={260} />
          </div>
          <div className="flex items-center justify-center">
            <Shim className="h-2.5 w-40 rounded-full" delay={320} />
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Shim className="h-12 w-full max-w-sm rounded-md" delay={140} />
        <Shim className="h-3 w-64 rounded-full" delay={200} />
      </div>
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
