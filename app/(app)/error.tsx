"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-1 items-center justify-center py-12">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
            <p className="max-w-sm text-sm text-zinc-500">
              {error.message || "An unexpected error occurred."}
            </p>
            {error.digest && (
              <p className="text-[10px] text-zinc-400">Ref: {error.digest}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={reset}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Try again
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Go home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
