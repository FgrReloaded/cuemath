# Mnemo

> Turn any PDF into a spaced-repetition flashcard deck you never forget.

Mnemo is the submission for the Cuemath AI Builder challenge — **Problem 1: The Flashcard Engine**. Upload a PDF (lecture notes, a textbook chapter, a cheatsheet), and Claude reads it and writes high-quality flashcards. The app then schedules your reviews using the SM-2 spaced repetition algorithm so you actually retain what you read.

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, async cookies, `proxy.ts` replacing middleware) |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Motion (framer-motion successor), lucide-react, sonner |
| Auth | Supabase Auth (magic link) via `@supabase/ssr` |
| DB | Supabase Postgres (pooler on `:6543`, `prepare: false`) + Drizzle ORM |
| AI | Vercel AI SDK v6 + AI Gateway → `anthropic/claude-sonnet-4-6`, structured output via `generateText({ output: Output.object({ schema }) })` |
| PDF | `pdfjs-dist@4` (legacy build, server-external) |
| Validation | Zod (payloads + LLM structured output schemas) |
| Scheduling | Custom SM-2 implementation (`lib/sm2.ts`) |

### Environment variables

See `.env.example`:

```env
DATABASE_URL=                            # Supabase Postgres (pooler :6543 recommended)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=    # (not the legacy anon key)
AI_GATEWAY_API_KEY=                      # Vercel AI Gateway token
```

### Local development

```bash
pnpm install
pnpm db:migrate        # custom migration runner (drizzle-kit hangs on the pooler)
pnpm dev
```

---

## Implementation — 9 steps

The build was done as a series of discrete, committed steps. Each step is self-contained so the progression is easy to follow in `git log`.

### Step 1 — Scaffolding, schema, migrations

- Installed deps, shadcn components, Tailwind v4 config.
- Drizzle schema in `db/schema.ts`:
  - **`decks`** — title, description, source filename, user ownership
  - **`cards`** — front/back, `type: "basic" | "cloze"`, tags, position, `ON DELETE CASCADE` from deck
  - **`reviews`** — 1:1 with a card, holds SM-2 state (`easeFactor`, `intervalDays`, `repetitions`, `lapses`, `nextReviewAt`, `lastReviewedAt`). Unique index on `cardId`, composite index on `(userId, nextReviewAt)` for fast due-card lookups.
  - **`review_log`** — append-only history of every rating: previous/new interval and ease, timestamp. Drives the stats page.
- Custom migration runner `db/migrate.ts` using `postgres-js` with `prepare: false` (drizzle-kit's built-in migrator hangs on the Supabase transaction-mode pooler).

### Step 2 — Supabase auth (SSR)

- `lib/supabase/server.ts`, `client.ts`, `proxy.ts` — SSR-aware Supabase clients using `@supabase/ssr` and the new `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Server client accepts an already-awaited `cookieStore` (Next 16 made `cookies()` async).
- `proxy.ts` at the project root (Next 16 replacement for `middleware.ts`) calls `updateSession()` to refresh tokens and redirects unauthed requests to `/login`. `PUBLIC_PATHS = ["/login", "/api/auth"]`.
- `app/login/page.tsx` + `actions.ts` — magic-link form with `emailRedirectTo` pointing at `/api/auth/callback`, which exchanges the OTP for a session cookie.
- `lib/supabase/guards.ts` — `requireUser()` helper used by all authed routes.

### Step 3 — App shell

- Route groups: `app/(app)/*` for the authed app, `app/login/*` for public.
- `app/(app)/layout.tsx` — sticky nav (`components/nav.tsx`), active-route highlighting, `UserMenu` with theme toggle, max-width container.
- `app/(app)/page.tsx` — dashboard: greeting line, four stat cards (Due now / Mastered / Learning / Total), deck grid with `cardCount` / `dueNow` badges, empty state.
- `lib/stats.ts` — `getDashboardStats()` (Promise.all of 5 count queries) and `getUserDecks()` (grouped join against `reviews` with `filter (where next_review_at <= NOW())`).

### Step 4 — PDF upload + AI card generation

- `app/(app)/upload/upload-client.tsx` — drag-and-drop zone with a phase state machine: **idle → generating → preview → saving**. The preview is fully editable (add/edit/delete cards, flip between basic & cloze) before saving.
- `lib/pdf/extract.ts` — `pdfjs-dist` legacy build, Uint8Array input, fake-worker mode, per-page `getTextContent()`. `next.config.ts` has `serverExternalPackages: ["pdfjs-dist"]` so Turbopack doesn't mangle its internals.
- `lib/ai/generate.ts` — uses the non-deprecated `generateText` + `Output.object({ schema })` API:
  ```ts
  const { output } = await generateText({
    model: gateway("anthropic/claude-sonnet-4-6"),
    output: Output.object({ schema: DeckSchema }),
    system: SYSTEM_PROMPT,
    temperature: 0.4,
    prompt: `…CONTENT:\n\n${content}`,
  });
  ```
  The prompt is a detailed teacher persona: prefer atomic questions, avoid yes/no, use cloze for definitions, limit to 40 cards per pass, etc. Content is capped at 160K characters.
- `app/api/decks/generate/route.ts` — `runtime: "nodejs"`, `maxDuration: 60`, 15 MB file limit, zod-validated multipart form, returns `{ title, description, cards[] }`.

### Step 5 — Persist deck + seed reviews

- `app/api/decks/route.ts` — `POST` accepts the edited preview, runs a transaction:
  1. insert `decks` row,
  2. bulk insert `cards` (with `position`),
  3. bulk insert `reviews` with `nextReviewAt = now` so everything is immediately due.
- Client redirects to the new deck detail page on success.

### Step 6 — SM-2 scheduler + study session

- `lib/sm2.ts` — four-button SM-2 (Again / Hard / Good / Easy). Constants: `MIN_EASE=1.3`, `MAX_EASE=2.8`, `RELAPSE_MINUTES=10`, `MATURE_THRESHOLD_DAYS=21`. Exports `schedule(state, rating)` and `formatInterval(days)`.
- `lib/study.ts` — `getDueCards(userId, deckId?, limit=100)` joining `reviews → cards → decks`, ordered by `lastReviewedAt asc nulls first, nextReviewAt asc` so brand-new cards come up first.
- `app/(app)/study/page.tsx` + `study-client.tsx` — full-screen review view:
  - 3D card flip using Motion's `rotateY` + CSS `backface-visibility`
  - Cloze rendering (`{{c1::Paris}}` → blank on front, revealed on back)
  - Keyboard: **Space/Enter** to flip, **1–4** to rate
  - Session summary with per-rating tally and recall %
- `app/api/reviews/route.ts` — `POST { cardId, rating }`, transactional: loads current review row → computes next state via `schedule()` → updates `reviews` → appends `review_log` with before/after snapshot.

### Step 7 — Deck detail + card CRUD

- `lib/decks.ts` — `getDeckDetail(userId, deckId)` returns the deck plus every card with its current review state (so the detail page can show per-card maturity badges).
- API routes (all `runtime: "nodejs"`, zod-validated, ownership-checked via joins):
  - `PATCH /api/decks/[id]` — edit title/description
  - `DELETE /api/decks/[id]` — cascades to cards & reviews via FK
  - `POST /api/decks/[id]/cards` — adds a card, auto-positions at the end, seeds its `reviews` row
  - `PATCH /api/cards/[id]` / `DELETE /api/cards/[id]`
- `app/(app)/decks/[id]/page.tsx` + `deck-client.tsx` — server component fetches the deck, client component handles inline editing. Per-card status badge: **New / Learning / Mature / Relearning** derived from `intervalDays` + `lastReviewedAt`. "Study" button links to `/study?deck=<id>` for a deck-filtered session.

### Step 8 — Progress & mastery

- `lib/progress.ts` — single `getProgress(userId)` call that fans out 6 queries in parallel:
  - per-day counts over the last 91 days (heatmap)
  - today / week / total review counts
  - 30-day retention (% of ratings ≥ Good)
  - maturity breakdown from the `reviews` table (new / learning / mature)
- Streak is computed from the heatmap array (walk backward from today for current, scan the full window for longest).
- `components/heatmap.tsx` — GitHub-style 13-week grid, 5 intensity levels, month + weekday labels, per-cell hover tooltip.
- `app/(app)/stats/page.tsx` — headline streak, four stat cards, heatmap, maturity progress bars.

### Step 9 — Polish

- **Loading skeletons** — `app/(app)/loading.tsx` (dashboard), `study/loading.tsx`, `decks/[id]/loading.tsx`. Staggered animation delays so the skeleton doesn't pulse in lockstep.
- **Error boundary** — `app/(app)/error.tsx` with retry + home link, logs the error.
- **Not-found** — `app/not-found.tsx` (global) and `app/(app)/decks/[id]/not-found.tsx` (fires when `getDeckDetail()` returns null from the page component).
- **Login button pending state** — `app/login/login-form.tsx` uses `useFormStatus()` to show a spinner + "Sending…" while the server action runs (magic-link emails aren't instantaneous).
- **Nav active state** — `components/nav.tsx` is now a client component using `usePathname()` to highlight the current section.
- **Dark mode** — theme toggle lives in `UserMenu` via `next-themes`; every component has explicit `dark:` variants.

---

## Architecture notes / gotchas worth keeping

**Next.js 16 is new.** `cookies()` is async, `searchParams` is a `Promise`, and `middleware.ts` is gone — use `proxy.ts` at the project root with the same matcher config. Check `node_modules/next/dist/docs/` for the current API when something looks off.

**The Supabase pooler runs in transaction mode.** That means no prepared statements. Two places need `prepare: false`:
- runtime client in `db/index.ts`
- migration runner in `db/migrate.ts`

`drizzle-kit migrate` itself hangs against the pooler — that's why there's a hand-rolled migrator.

**PDF extraction.** Start with `pdfjs-dist@4` (requires Node ≥ 20). Version 5 needs Node ≥ 22.13 and will not work on 22.11. Add `pdfjs-dist` to `serverExternalPackages` in `next.config.ts` or Turbopack will mangle the worker setup and you'll get cryptic `Cannot destructure property 'docId' of 'e' as it is undefined` errors.

**AI SDK.** `generateObject` is deprecated. The migration is `generateText({ output: Output.object({ schema }) })`. The returned `output` is `OUTPUT | undefined`, so null-check before using.

**Dates and raw SQL.** Don't interpolate a JavaScript `Date` directly inside a raw `` sql`` `` template — `postgres-js` can't encode it without column-type context. Either use the typed helpers (`lte(col, date)`) or reach for `NOW()` / `date_trunc(...)` in the SQL itself.

---

## Project layout

```
app/
  (app)/                authed layout + routes
    page.tsx            dashboard
    upload/             PDF upload + preview
    decks/[id]/         deck detail + CRUD
    study/              review session
    stats/              progress + heatmap
    loading.tsx error.tsx
  login/                magic-link auth
  api/
    auth/callback/      OTP → session
    decks/              generate, save, CRUD
    cards/[id]/         card CRUD
    reviews/            rating submission
components/             nav, heatmap, user-menu, theme-provider, ui/
db/
  schema.ts  index.ts  migrate.ts
lib/
  sm2.ts                spaced-repetition scheduler
  stats.ts progress.ts  dashboard + stats queries
  study.ts decks.ts     per-page data helpers
  ai/generate.ts        Claude + structured output
  pdf/extract.ts        pdfjs-dist wrapper
  supabase/             server, client, proxy, guards
proxy.ts                Next 16 session refresh
next.config.ts          serverExternalPackages: ["pdfjs-dist"]
```
