"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="group w-full"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending the link…
        </>
      ) : (
        <>
          Send magic link
          <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </Button>
  );
}

export function LoginForm({ error }: { error?: string }) {
  return (
    <form action={signInWithEmail} className="space-y-4">
      <div className="space-y-2">
        <Label
          htmlFor="email"
          className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
        >
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="h-12 border-0 border-b border-border bg-transparent px-0 text-base shadow-none transition-colors focus-visible:border-[var(--brand)] focus-visible:ring-0"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red-200/60 bg-red-50/50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400"
        >
          <span className="mt-0.5 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-red-500" />
          {error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
