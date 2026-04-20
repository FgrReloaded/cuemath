import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DeckNotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-1 items-center justify-center py-12">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
            <FileQuestion className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Deck not found</h1>
            <p className="max-w-sm text-sm text-zinc-500">
              It may have been deleted, or the link is incorrect.
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
