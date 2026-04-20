import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { LoginForm } from "./login-form";

type SearchParams = Promise<{
  sent?: string;
  email?: string;
  error?: string;
  next?: string;
}>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { sent, email, error } = await searchParams;

  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[40vh] bg-gradient-to-b from-[var(--brand)]/[0.06] to-transparent"
      />

      <header className="relative flex items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="group flex items-center gap-2">
          <LogoMark className="h-5 w-5 text-foreground transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:-translate-y-px group-hover:rotate-[-4deg]" />
          <span className="text-[15px] font-semibold tracking-tight">Mnemo</span>
        </Link>
        <span className="hidden text-[11px] uppercase tracking-[0.22em] text-muted-foreground sm:block">
          Sign in · magic link
        </span>
      </header>

      <main className="relative mx-auto grid min-h-[calc(100dvh-5rem)] w-full max-w-6xl grid-cols-1 gap-16 px-6 pb-10 pt-4 md:grid-cols-12 md:gap-20 md:px-10 md:pt-10">
        <section className="md:col-span-7 md:pt-16">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Welcome
          </p>
          <h1 className="mt-4 text-[clamp(2.75rem,6.5vw,5rem)] font-medium leading-[0.96] tracking-[-0.035em]">
            Remember what{" "}
            <span className="italic font-serif font-normal text-muted-foreground">
              you read
            </span>
            .
          </h1>
          <p className="mt-5 max-w-md text-[15px] text-muted-foreground">
            Hand us a PDF — a chapter, lecture notes, a paper. We turn it into a
            deck, and spaced repetition does the rest. You keep what you learn.
          </p>

          <ol className="mt-10 space-y-3 border-l border-border/60 pl-5 text-sm">
            <li className="flex gap-3">
              <span className="tabular-nums text-[var(--brand)]">01</span>
              <span className="text-muted-foreground">
                Drop a PDF, up to 15 MB.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="tabular-nums text-[var(--brand)]">02</span>
              <span className="text-muted-foreground">
                Claude drafts 12–25 atomic cards.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="tabular-nums text-[var(--brand)]">03</span>
              <span className="text-muted-foreground">
                Review daily — the app decides when.
              </span>
            </li>
          </ol>

          <div className="mt-10 hidden max-w-md md:block">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Memory graph · a typical week
            </p>
            <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
              <div className="w-[48%] bg-emerald-500 dark:bg-emerald-500/90" />
              <div className="w-[32%] bg-amber-400 dark:bg-amber-500/90" />
              <div className="w-[20%] bg-zinc-300 dark:bg-zinc-600" />
            </div>
            <div className="mt-2 flex items-center gap-4 text-[11px] tabular-nums text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Mature
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 dark:bg-amber-500" />
                Learning
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                New
              </span>
            </div>
          </div>
        </section>

        <section className="md:col-span-5 md:pt-20">
          <div className="md:sticky md:top-24 md:border-l md:border-border/60 md:pl-10">
            {sent ? <SentState email={email} /> : <SignInForm error={error} />}
          </div>
        </section>
      </main>

      <footer className="relative mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/60 px-6 py-5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:px-10">
        <span>Mnemo</span>
        <span className="h-1 w-1 rounded-full bg-border" />
        <span>spaced repetition, but patient</span>
      </footer>
    </div>
  );
}

function SignInForm({ error }: { error?: string }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Sign in
        </p>
        <h2 className="text-3xl font-medium tracking-[-0.02em]">
          We&apos;ll email you a link.
        </h2>
        <p className="text-sm text-muted-foreground">
          No password, nothing to remember. One click and you&apos;re in.
        </p>
      </div>

      <LoginForm error={error} />

      <div className="space-y-2 border-t border-border/60 pt-5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <p>
          New here?{" "}
          <span className="normal-case tracking-normal text-foreground">
            Same flow — the link creates your account.
          </span>
        </p>
      </div>
    </div>
  );
}

function SentState({ email }: { email?: string }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Link sent
        </p>
      </div>

      <h2 className="text-3xl font-medium tracking-[-0.02em]">
        Check your inbox.
      </h2>

      <p className="text-sm leading-relaxed text-muted-foreground">
        We emailed a sign-in link to{" "}
        <span className="font-medium text-foreground">{email ?? "your address"}</span>
        . Click it from any device and you&apos;re in.
      </p>

      <ul className="space-y-2 border-l border-border/60 pl-5 text-sm text-muted-foreground">
        <li>· The link works once, then expires.</li>
        <li>· Didn&apos;t arrive? Check spam.</li>
      </ul>

      <Link
        href="/login"
        className="inline-block text-[11px] uppercase tracking-[0.18em] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        Use a different email
      </Link>
    </div>
  );
}
