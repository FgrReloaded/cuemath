import { extractText, getDocumentProxy } from "unpdf";

export async function extractPdfText(
  buffer: ArrayBuffer,
): Promise<{ text: string; pages: number }> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text, totalPages } = await extractText(pdf, { mergePages: true });
  const joined = Array.isArray(text) ? text.join("\n\n") : text;
  return { text: joined, pages: totalPages };
}
