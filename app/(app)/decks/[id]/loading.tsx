export default function DeckLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="h-7 w-20 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-9 w-72 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-48 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
