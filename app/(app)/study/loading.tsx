export default function StudyLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
      <div className="mb-6 space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-32 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-10 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="h-1 w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="min-h-[360px] flex-1 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
      <div className="mt-6 h-12 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
