# Mnemo — Submission Writeup

**Challenge:** Problem 1 — The Flashcard Engine
**Live app:** _(to be added after deploy)_
**Repo:** this one

---

## What I built

Mnemo turns a PDF into a spaced-repetition flashcard deck. The full loop works end-to-end:

1. **Upload a PDF** (drag-and-drop, up to 15 MB).
2. Server extracts the text and sends it to Claude Sonnet 4.6 via the Vercel AI Gateway with a structured-output schema. Claude returns a deck — title, description, and a list of `basic` or `cloze` cards.
3. **Preview and edit** every card before saving. Add, delete, flip types, rewrite freely.
4. **Save** the deck; each card gets seeded with an SM-2 review row that's immediately due.
5. **Study.** Full-screen 3D-flip UI, keyboard-driven (Space to flip, 1–4 to rate), scheduler runs SM-2 on the server and appends every rating to a `review_log` table.
6. **Progress.** A stats page with current/longest streak, 13-week heatmap, 30-day recall %, and a card-maturity breakdown (new / learning / mature based on interval length).
7. **Manage.** Deck detail with per-card CRUD, per-card status badges, inline editing; decks cascade-delete correctly.

Everything is authed (Supabase magic link), ownership-checked at the DB level via joins, and works in dark mode.

## Key decisions and tradeoffs

**Next.js 16 + React 19, fresh.** The starter template already used these, and I kept them. Upside: the latest APIs (async `cookies()`, async `searchParams`, `proxy.ts` replacing middleware) are genuinely cleaner for SSR auth. Downside: a lot of my instinct for the older middleware/route-handler shape was wrong, so I leaned on the bundled docs in `node_modules/next/dist/docs/` for anything that felt off.

**Supabase for auth, Neon for the database.** Started on Supabase for both — magic-link auth in <20 LOC is hard to beat. But the free-tier project auto-pauses after a week of inactivity, which bit me mid-build with a `CONNECT_TIMEOUT` that looked like a code regression until I traced it to the dashboard. Swapped the DB to Neon (always-on free tier, wakes in ~500ms) and kept Supabase strictly for auth. Drizzle schema, queries, migrations — nothing else changed, it was a one-line `DATABASE_URL` swap. Best of both: auth I didn't have to write, a DB that doesn't disappear on me.

**Drizzle over Prisma.** Smaller runtime, better Postgres-feature access (I use `filter (where …)` aggregates and `date_trunc` in the stats queries), fewer layers of abstraction to reason about. The schema is ~100 lines and I never felt boxed in.

**Store the SM-2 state in its own `reviews` table, 1:1 with a card.** I considered embedding it in the card row but splitting it out lets the due-card query be an indexed scan on `(user_id, next_review_at)` without touching card content, and keeps the card table cheap to read for list views.

**Keep a `review_log` append-only table alongside `reviews`.** The `reviews` row is overwritten on every rating, which means you'd otherwise lose history. The log is what drives the heatmap, streak, and retention %. It's a small amount of extra write cost for a lot of observability.

**LLM structured output via `generateText` + `Output.object({ schema })`.** The older `generateObject` API is deprecated in `ai@6`. The non-deprecated path uses a zod schema directly, which doubles as runtime validation. One gotcha: the result's `output` is `OUTPUT | undefined`, so you have to null-check.

**AI Gateway (via Vercel) instead of calling Anthropic directly.** One token, easier model swapping, and the `gateway("anthropic/claude-sonnet-4-6")` helper is literally one line to wire up.

**SM-2 over FSRS.** FSRS is measurably better for long-term retention, but SM-2 is ~80 lines, well-understood, and good enough for a demo. If this were a real product I'd ship SM-2 first and migrate later — the `review_log` table gives me the training data when I'm ready.

## Interesting challenges and how I solved them

**Claude responses needed a schema, not prose.** My first pass asked Claude to return JSON in a code fence and parsed it. It worked most of the time but occasionally produced extra commentary or slightly malformed JSON. Switching to `generateText({ output: Output.object({ schema: DeckSchema }) })` with a zod schema made this bulletproof — the AI SDK handles the structured-output contract and zod validates before I ever touch the data. The prompt then focused purely on card quality (atomic questions, no yes/no, use cloze for definitions, etc.) instead of JSON shape.

**PDF extraction in a Next.js server route was the hardest part.** I started with `unpdf` (recommended for serverless). Two problems surfaced:
1. **`Promise.try is not a function`** — `unpdf`'s bundled pdf.js uses ES2025's `Promise.try`, which doesn't exist until Node 22.13. I was on 22.11. Wrote a tiny polyfill.
2. **`Cannot destructure property 'docId' of 'e'`** — Turbopack was mangling unpdf's internal worker setup. Adding `serverExternalPackages: ["unpdf"]` didn't fix it.

I ended up swapping to `pdfjs-dist@4` directly (pinned to 4.x because 5.x also requires Node ≥ 22.13) and adding it to `serverExternalPackages`. Clean extraction, per-page text content, fake-worker mode. Total time lost: probably two hours.

**Dates inside raw `sql` templates broke at runtime.** In `lib/stats.ts` I had `sql\`… where next_review_at <= ${now}\`` where `now` was a `Date`. `postgres-js` couldn't encode it — the driver needs column-type context, which raw templates don't provide. Typed helpers (`lte(col, date)`) work because they carry the column type. The fix was switching the raw-SQL case to `NOW()`, which is arguably better anyway since it happens in the DB's timezone consistently.

**Supabase pooler + Drizzle migrations.** `drizzle-kit migrate` just hung. The pooler runs in transaction mode and prepared-statement handshakes don't survive it. I wrote a ~40-line migration runner (`db/migrate.ts`) that reads the generated SQL files, splits on `--> statement-breakpoint`, and executes each statement with `prepare: false`. It does the same thing drizzle-kit does, minus the hang.

**Supabase project auto-pausing mid-build.** A day into development, every query started failing with `CONNECT_TIMEOUT`. I burned a while assuming my latest changes (the sharing/hints endpoints) had broken something, until I checked the Supabase dashboard and saw the project was paused — free-tier Supabase pauses after ~a week of inactivity and requires a manual unpause click. My first instinct was a full migration to Convex, but that would have meant rewriting the entire data layer and auth with no way to validate before the submission. The pragmatic call was to move only the database to Neon (always-on free tier) and keep Supabase for auth. Drizzle and all the queries didn't change — it was a `DATABASE_URL` swap and a re-run of the migration script. Lesson: when a platform bites you, isolate *which* piece is hurting before blowing up the stack.

**Next 16 search params are a Promise.** The `/study?deck=<id>` route takes a search param; my first pass destructured it synchronously and got a warning. The page signature is `{ searchParams: Promise<{ deck?: string }> }` now, awaited inside the async server component. Small but easy to miss.

**Login had no pending state.** The server action for sending the magic link takes a second or two and the button just sat there. Extracted the form into a client component and used `useFormStatus()` — spinner + "Sending…" + disabled state. One of those "obvious in hindsight" things.

## What I'd add / improve with more time

- **Deploy to Vercel** — the app is deploy-ready (`serverExternalPackages` configured, `runtime: "nodejs"` where it matters, 60s `maxDuration` on the generate route). I just didn't pull the trigger on this pass because I wanted the core loop solid first.
- **PDF chunking + multi-pass generation** — I currently truncate to 160K characters and do one LLM call. A larger book needs to be chunked (by chapter, ideally using the PDF's outline/bookmarks if present) with deduping across chunks. Cards would stream into the preview as each chunk finishes.
- **FSRS instead of SM-2** — the `review_log` already has what FSRS needs (rating, prev/new interval, prev/new ease, timestamp). Swapping schedulers is a contained change.
- **Tests.** I did none. The SM-2 scheduler is the most obviously testable piece — a handful of cases covering the state transitions would catch most of what could go wrong.
- **Deck sharing / import.** Right now decks are per-user. An "import deck" link, or a public-deck toggle with a shareable URL, would 10× the usefulness for studying from shared material.
- **Native OCR for image-only PDFs** — my current extraction relies on the PDF having a text layer. Scans fall through as empty text. A fallback to Tesseract (or a vision model) would cover this case.
- **Image support on the card back** — Claude often wants to reference a diagram from the PDF. Right now we throw the images away during text extraction. Keeping them and letting the card `back` render markdown with inline images would be a big quality win.
- **Keyboard-first deck management** — study has shortcuts; the rest of the app doesn't. A small command palette (`cmd+k`) for search + jump would be the right level of investment.
- **Background job for generation** — the generation route is synchronous and capped at 60s. For larger PDFs, this should move to a queued job with a status endpoint the client polls.
- **Rate limiting + per-user generation quotas** — not a priority for a demo but necessary before any real launch, given the LLM cost.
- **Accessibility pass.** I was careful with semantics and dark-mode contrast but I haven't tested with a screen reader or run an audit.

## What I'm happiest about

- The editable preview — Claude gets 90% of the way there, but the user having full control over every card _before_ saving makes the AI feel like an assistant instead of a black box. That's the part that makes this feel usable.
- The stats page. Streak + heatmap + recall % gives the loop a reason to come back, and it all falls out of the `review_log` table without extra bookkeeping.
- The commit history. Each step is its own commit; anyone can step through the build from empty scaffold to finished app and see exactly what happened.
