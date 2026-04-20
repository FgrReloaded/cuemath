import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { LoginForm } from "./login-form";

type SearchParams = Promise<{ sent?: string; email?: string; error?: string; next?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { sent, email, error } = await searchParams;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-linear-to-br from-zinc-50 via-white to-zinc-100 px-4 dark:from-zinc-950 dark:via-black dark:to-zinc-900">
      <Card className="w-full max-w-sm border-zinc-200/80 shadow-xl shadow-zinc-950/5 dark:border-zinc-800/80">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            <Sparkles className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl tracking-tight">Welcome to Mnemo</CardTitle>
          <CardDescription>Turn any PDF into a deck you never forget.</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                Check <span className="font-medium">{email}</span> — we sent a magic link.
              </p>
              <p className="text-xs text-zinc-500">You can close this tab.</p>
            </div>
          ) : (
            <LoginForm error={error} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
