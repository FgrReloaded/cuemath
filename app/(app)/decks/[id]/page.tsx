import { notFound } from "next/navigation";
import { getDeckDetail } from "@/lib/decks";
import { requireUser } from "@/lib/supabase/guards";
import { DeckClient } from "./deck-client";

export const metadata = { title: "Deck · Mnemo" };

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const deck = await getDeckDetail(user.id, id);
  if (!deck) notFound();

  return <DeckClient deck={deck} />;
}
