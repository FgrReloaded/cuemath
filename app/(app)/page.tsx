import Link from "next/link";
import { ArrowRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemoryBar } from "@/components/memory-bar";
import { DeckRow } from "@/components/deck-row";
import { requireUser } from "@/lib/supabase/guards";
import { getDashboardStats, getUserDecks } from "@/lib/stats";

function EmptyState() {
  return (
    <div className="border-t border-border/70 pt-16">
      <div className="grid items-start gap-10 md:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            First deck
          </p>
          <h3 className="text-2xl font-medium tracking-tight text-foreground">
            Drop in a PDF <span className="italic font-serif">—</span> Mnemo does
            the rest.
          </h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Lecture notes, a textbook chapter, a research paper. We read the
            material and shape it into cards you&apos;ll actually remember.
          </p>
          <Button asChild className="mt-2">
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload a PDF
            </Link>
          </Button>
        </div>

        <aside className="relative hidden md:block">
          <div className="space-y-3 rounded-lg border border-dashed border-border/70 bg-card/30 p-5 text-sm">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              What you&apos;ll get
            </p>
            <ol className="space-y-2 text-muted-foreground">
              <li className="flex gap-3">
                <span className="tabular-nums text-[var(--brand)]">01</span>
                <span>A deck of 12–25 cards shaped like the source.</span>
              </li>
              <li className="flex gap-3">
                <span className="tabular-nums text-[var(--brand)]">02</span>
                <span>SM-2 scheduling so reviews stick.</span>
              </li>
              <li className="flex gap-3">
                <span className="tabular-nums text-[var(--brand)]">03</span>
                <span>A streak to keep you honest.</span>
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, decks] = await Promise.all([
    getDashboardStats(user.id),
    getUserDecks(user.id),
  ]);

  const greeting = user.email?.split("@")[0] ?? "there";
  const hasDecks = decks.length > 0;

  const hero =
    stats.dueNow > 0
      ? {
          eyebrow: `${greeting}, today's stack`,
          headline: `${stats.dueNow}`,
          headlineSuffix: stats.dueNow === 1 ? "card" : "cards",
          tail: "ready for review",
        }
      : hasDecks
        ? {
            eyebrow: `welcome back, ${greeting}`,
            headline: "Caught",
            headlineSuffix: "up",
            tail: "no cards due — your future self thanks you.",
          }
        : {
            eyebrow: `hello, ${greeting}`,
            headline: "Empty",
            headlineSuffix: "shelves",
            tail: "start with one PDF — we'll handle the shaping.",
          };

  return (
    <div className="space-y-20">
      <section className="grid gap-10 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-8 md:col-start-1 space-y-6">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {hero.eyebrow}
          </p>
          <h1 className="font-sans text-[clamp(2.75rem,7vw,5rem)] font-medium leading-[0.95] tracking-[-0.035em] text-foreground">
            <span className="tabular-nums">{hero.headline}</span>{" "}
            <span className="italic font-serif font-normal text-muted-foreground">
              {hero.headlineSuffix}
            </span>
          </h1>
          <p className="max-w-md text-[15px] text-muted-foreground">{hero.tail}</p>

          {stats.dueNow > 0 && (
            <div className="pt-2">
              <Button asChild size="lg" className="group">
                <Link href="/study">
                  Start studying
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        <aside className="md:col-span-4 md:col-start-9 md:pt-2">
          <div className="space-y-5 border-l border-border/60 pl-6 md:sticky md:top-24">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Memory graph
              </p>
              <p className="mt-2 flex items-baseline gap-1.5 font-sans">
                <span className="text-4xl font-medium tracking-tight tabular-nums">
                  {stats.cardCount}
                </span>
                <span className="text-sm text-muted-foreground">
                  card{stats.cardCount === 1 ? "" : "s"}
                </span>
              </p>
            </div>

            <MemoryBar
              mature={stats.mastered}
              learning={stats.learning}
              fresh={Math.max(0, stats.cardCount - stats.mastered - stats.learning)}
            />

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div>
                <p className="uppercase tracking-[0.16em] text-muted-foreground">
                  Decks
                </p>
                <p className="mt-1 text-lg font-medium tabular-nums">
                  {stats.deckCount}
                </p>
              </div>
              <div>
                <p className="uppercase tracking-[0.16em] text-muted-foreground">
                  Due
                </p>
                <p className="mt-1 text-lg font-medium tabular-nums text-[var(--brand)]">
                  {stats.dueNow}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {hasDecks ? (
        <section>
          <div className="flex items-end justify-between border-b border-border/70 pb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Shelf
              </p>
              <h2 className="mt-1 text-xl font-medium tracking-tight">
                {decks.length} deck{decks.length === 1 ? "" : "s"}
              </h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="group">
              <Link href="/upload">
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                New deck
              </Link>
            </Button>
          </div>
          <div>
            {decks.map((deck, i) => (
              <DeckRow key={deck.id} deck={deck} index={i} />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState />
      )}

      <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/60 pt-5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>Mnemo</span>
        <span className="h-1 w-1 rounded-full bg-border" />
        <span>spaced repetition, but patient</span>
        <span className="ml-auto tabular-nums normal-case tracking-normal text-muted-foreground/70">
          signed in as {user.email}
        </span>
      </footer>
    </div>
  );
}
