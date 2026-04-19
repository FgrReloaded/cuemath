import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { extractPdfText } from "@/lib/pdf/extract";
import { generateDeckFromText } from "@/lib/ai/generate";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 15 * 1024 * 1024; 

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 15 MB)" },
      { status: 413 },
    );
  }
  if (file.type && file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are supported" },
      { status: 415 },
    );
  }

  const buffer = await file.arrayBuffer();

  let extracted: { text: string; pages: number };
  try {
    extracted = await extractPdfText(buffer);
  } catch (err) {
    console.error("PDF extraction failed", err);
    return NextResponse.json(
      { error: "Could not read this PDF. Try a different file." },
      { status: 422 },
    );
  }

  if (extracted.text.trim().length < 200) {
    return NextResponse.json(
      {
        error:
          "This PDF doesn't seem to have readable text (scanned images aren't supported yet).",
      },
      { status: 422 },
    );
  }

  try {
    const deck = await generateDeckFromText({
      text: extracted.text,
      filename: file.name,
    });
    return NextResponse.json({
      ...deck,
      sourceFilename: file.name,
      pages: extracted.pages,
    });
  } catch (err) {
    console.error("Card generation failed", err);
    return NextResponse.json(
      { error: "Failed to generate cards. Please try again." },
      { status: 500 },
    );
  }
}
