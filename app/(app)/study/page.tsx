import Link from "next/link";
import { ArrowLeft, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="mx-auto flex max-w-xl flex-1 items-center justify-center py-12">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
              <PartyPopper className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight">
                Nothing due right now
              </h1>
              <p className="max-w-sm text-sm text-zinc-500">
                Come back later, or add more cards to get ahead of the curve.
              </p>
            </div>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <StudyClient initialCards={cards} />;
}
