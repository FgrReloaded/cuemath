"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { LogoMark } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative px-2 py-1 text-sm tracking-tight transition-colors ${
        active
          ? "text-zinc-900 dark:text-zinc-50"
          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200"
      }`}
    >
      {label}
      {active && (
        <motion.span
          layoutId="nav-dot"
          className="absolute -bottom-1 left-1/2 h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-[var(--brand)]"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );
}

export function Nav({ email, dueNow }: { email: string; dueNow: number }) {
  const pathname = usePathname();
  const isDecks = pathname === "/" || pathname.startsWith("/decks");
  const isStats = pathname.startsWith("/stats");
  const isUpload = pathname.startsWith("/upload");

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2"
          aria-label="Mnemo home"
        >
          <LogoMark className="h-5 w-5 text-foreground transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:-translate-y-px group-hover:rotate-[-4deg]" />
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            Mnemo
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <div className="flex items-center gap-5">
            <NavLink href="/" label="Decks" active={isDecks} />
            <NavLink href="/stats" label="Stats" active={isStats} />
            <NavLink href="/upload" label="Upload" active={isUpload} />
          </div>

          {dueNow > 0 && (
            <Link
              href="/study"
              className="group relative hidden items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium tabular-nums text-foreground transition-colors hover:border-[var(--brand)]/50 sm:flex"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand)]/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
              </span>
              <span>{dueNow} due</span>
              <span className="text-muted-foreground transition-colors group-hover:text-foreground">
                → study
              </span>
            </Link>
          )}

          <div className="h-5 w-px bg-border/70" />
          <UserMenu email={email} />
        </nav>
      </div>
    </header>
  );
}
