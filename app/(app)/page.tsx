import Link from "next/link";
import { ArrowRight, BookOpen, Flame, Sparkles, Target, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/supabase/guards";
import { getDashboardStats, getUserDecks } from "@/lib/stats";

function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: "default" | "accent";
}) {
  return (
    <Card
      className={
        tone === "accent"
          ? "border-zinc-900/10 bg-gradient-to-br from-zinc-900 to-zinc-800 text-white dark:from-white dark:to-zinc-100 dark:text-zinc-900"
          : ""
      }
    >
      <CardContent className="flex items-center justify-between p-5">
        <div className="space-y-1">
          <p
            className={
              tone === "accent"
                ? "text-xs font-medium uppercase tracking-wide text-white/70 dark:text-zinc-700"
                : "text-xs font-medium uppercase tracking-wide text-zinc-500"
            }
          >
            {label}
          </p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div
          className={
            tone === "accent"
              ? "flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 dark:bg-zinc-900/10"
              : "flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          }
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
          <Sparkles className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold tracking-tight">
            Your first deck is a PDF away
          </h3>
          <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            Drop in a chapter, notes, or a textbook. Mnemo reads it and writes the
            flashcards for you.
          </p>
        </div>
        <Button asChild className="mt-2">
          <Link href="/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload a PDF
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function DeckCard({
  deck,
}: {
  deck: {
    id: string;
    title: string;
    description: string | null;
    cardCount: number;
    dueNow: number;
  };
}) {
  return (
    <Card className="group transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex-1 space-y-1.5">
          <h3 className="line-clamp-2 font-semibold tracking-tight">{deck.title}</h3>
          {deck.description && (
            <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
              {deck.description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>{deck.cardCount} cards</span>
            {deck.dueNow > 0 && (
              <Badge variant="secondary" className="font-normal">
                {deck.dueNow} due
              </Badge>
            )}
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Link href={`/decks/${deck.id}`}>
              Open
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, decks] = await Promise.all([
    getDashboardStats(user.id),
    getUserDecks(user.id),
  ]);

  const greeting = user.email?.split("@")[0] ?? "there";

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-sm text-zinc-500">Welcome back, {greeting}</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {stats.dueNow > 0
              ? `${stats.dueNow} card${stats.dueNow === 1 ? "" : "s"} ready for review`
              : "You're all caught up"}
          </h1>
        </div>
        {stats.dueNow > 0 && (
          <Button asChild size="lg">
            <Link href="/study">
              Start studying
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Due now"
          value={stats.dueNow}
          icon={<Flame className="h-5 w-5" />}
          tone={stats.dueNow > 0 ? "accent" : "default"}
        />
        <StatCard
          label="Mastered"
          value={stats.mastered}
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          label="Learning"
          value={stats.learning}
          icon={<Sparkles className="h-5 w-5" />}
        />
        <StatCard
          label="Total cards"
          value={stats.cardCount}
          icon={<BookOpen className="h-5 w-5" />}
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Your decks</h2>
          {decks.length > 0 && (
            <Button asChild variant="outline" size="sm">
              <Link href="/upload">
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                New deck
              </Link>
            </Button>
          )}
        </div>
        {decks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
