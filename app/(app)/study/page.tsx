import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedFlame } from "@/components/animated-flame";
import { getDueCards } from "@/lib/study";
import { requireUser } from "@/lib/supabase/guards";
import { StudyClient } from "./study-client";

export const metadata = { title: "Study · Mnemo" };

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ deck?: string }>;
}) {
  const user = await requireUser();
  const { deck } = await searchParams;
  const cards = await getDueCards(user.id, deck);

  if (cards.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 items-center">
        <div className="w-full space-y-8">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100/70 dark:bg-emerald-950/30">
              <AnimatedFlame active size={20} />
            </div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Inbox zero
            </p>
            <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.02] tracking-[-0.025em]">
              Nothing due <span className="italic font-serif">right now</span>.
            </h1>
            <p className="max-w-md text-[15px] text-muted-foreground">
              Your future self is getting reminded at just the right moment —
              that&apos;s the whole point. Come back later, or add more cards to
              get ahead of the curve.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to shelf
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/upload">Add a new deck</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <StudyClient initialCards={cards} />;
}
