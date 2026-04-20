export default function Loading() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <div className="h-3 w-28 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-9 w-80 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
