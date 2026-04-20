import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl items-center justify-center p-6">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
            <Compass className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
            <p className="max-w-sm text-sm text-zinc-500">
              We couldn&apos;t find what you&apos;re looking for.
            </p>
          </div>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
