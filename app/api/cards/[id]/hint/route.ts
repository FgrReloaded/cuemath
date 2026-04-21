import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { Output, gateway, generateText } from "ai";
import { db } from "@/db";
import { cards, decks } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const HintSchema = z.object({
  hint: z
    .string()
    .min(1)
    .max(300)
    .describe("A short, helpful hint that nudges toward the answer without giving it away."),
});

const HINT_PROMPT = `You are a study assistant. Given a flashcard's question (front) and answer (back), generate a SHORT hint that helps the student recall the answer without giving it away outright.

Rules:
- 1–2 sentences max
- Use mnemonics, first-letter clues, analogies, or contextual nudges
- Never reveal the full answer
- Match the subject's tone (scientific for science, casual for general knowledge)
- For cloze cards, hint at the missing word(s) specifically`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [card] = await db
    .select({
      front: cards.front,
      back: cards.back,
      type: cards.type,
    })
    .from(cards)
    .innerJoin(decks, eq(decks.id, cards.deckId))
    .where(and(eq(cards.id, id), eq(decks.userId, user.id)))
    .limit(1);

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  let level = 1;
  try {
    const body = await request.json();
    if (body.level === 2) level = 2;
    if (body.level === 3) level = 3;
  } catch {
    // default level 1
  }

  const levelInstructions =
    level === 1
      ? "Give a vague contextual nudge — category, era, or field. Don't mention any part of the answer."
      : level === 2
        ? "Give a more direct hint — first letter, word count, or a strong analogy. Still don't state the answer."
        : "Give a very strong hint — partial answer, fill-in-the-blank with most letters, or a near-giveaway clue.";

  try {
    const { output } = await generateText({
      model: gateway("anthropic/claude-sonnet-4-6"),
      output: Output.object({ schema: HintSchema }),
      system: HINT_PROMPT,
      temperature: 0.7,
      prompt: `Hint level: ${level}/3 — ${levelInstructions}

Card type: ${card.type}
Front: ${card.front}
Back: ${card.back}`,
    });

    if (!output) {
      throw new Error("No hint generated");
    }

    return NextResponse.json({ hint: output.hint, level });
  } catch (err) {
    console.error("Hint generation failed", err);
    return NextResponse.json(
      { error: "Could not generate a hint" },
      { status: 500 },
    );
  }
}
