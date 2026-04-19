import { Output, gateway, generateText } from "ai";
import { z } from "zod";

export const CardSchema = z.object({
  front: z
    .string()
    .min(3)
    .max(500)
    .describe("The question or prompt shown first."),
  back: z
    .string()
    .min(3)
    .max(2000)
    .describe("The answer. Complete but concise."),
  type: z
    .enum(["basic", "cloze"])
    .describe("'basic' Q/A or 'cloze' with {{c1::…}} deletions."),
  tags: z.array(z.string().min(1).max(30)).max(3),
});

export const DeckSchema = z.object({
  title: z
    .string()
    .min(3)
    .max(80)
    .describe("A short deck title derived from the content."),
  description: z
    .string()
    .max(240)
    .describe("One sentence describing what the deck teaches."),
  cards: z.array(CardSchema).min(5).max(40),
});

export type GeneratedDeck = z.infer<typeof DeckSchema>;
export type GeneratedCard = z.infer<typeof CardSchema>;

const SYSTEM_PROMPT = `
You are a master teacher turning a document into a flashcard deck for long-term retention.

Principles:
- Cover the material comprehensively: definitions, core concepts, relationships, notable examples, edge cases.
- Each card tests ONE thing. No compound questions.
- Front: crisp, unambiguous question or prompt. Back: complete but concise answer.
- Prefer active recall ("Why does X happen?") over passive recognition ("What is X?").
- Use cloze deletion ({{c1::…}}) when the shape of the fact makes it natural (lists, sequences, key terms in a sentence).
- Write in the student's voice; no "according to the text" hedging.
- Skip trivial/meta cards (chapter numbers, figure captions, page references).
- Math: use LaTeX inline ($x^2$) or block ($$...$$).
- Aim for 12–25 cards for a typical chapter; fewer only if content is genuinely thin.

Output the deck title, a 1-sentence description, and the cards.
`.trim();

const MAX_CHARS = 160_000;

export async function generateDeckFromText({
  text,
  filename,
}: {
  text: string;
  filename?: string;
}): Promise<GeneratedDeck> {
  const content = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

  const { output } = await generateText({
    model: gateway("anthropic/claude-sonnet-4-6"),
    output: Output.object({ schema: DeckSchema }),
    system: SYSTEM_PROMPT,
    temperature: 0.4,
    prompt: `${filename ? `Source document: ${filename}\n\n` : ""}CONTENT:\n\n${content}`,
  });

  if (!output) {
    throw new Error("Model returned no structured output");
  }

  return output;
}
