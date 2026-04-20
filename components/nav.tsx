"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={
        active
          ? "text-zinc-900 dark:text-white"
          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      }
    >
      <Link href={href}>{label}</Link>
    </Button>
  );
}

export function Nav({ email }: { email: string }) {
  const pathname = usePathname();
  const isDecks = pathname === "/" || pathname.startsWith("/decks");
  const isStats = pathname.startsWith("/stats");

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold tracking-tight">Mnemo</span>
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink href="/" label="Decks" active={isDecks} />
          <NavLink href="/stats" label="Stats" active={isStats} />
          <Button asChild size="sm" className="ml-2">
            <Link href="/upload">New deck</Link>
          </Button>
          <div className="ml-2">
            <UserMenu email={email} />
          </div>
        </nav>
      </div>
    </header>
  );
}
