import "./promise-try-polyfill";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export async function extractPdfText(
  buffer: ArrayBuffer,
): Promise<{ text: string; pages: number }> {
  const pdf = await getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }
  await pdf.destroy();

  return { text: pages.join("\n\n"), pages: pdf.numPages };
}
