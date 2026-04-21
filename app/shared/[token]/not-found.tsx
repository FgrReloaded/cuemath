import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SharedNotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Not found
        </p>
        <h1 className="text-3xl font-medium tracking-tight">
          This deck is gone
        </h1>
        <p className="text-sm text-muted-foreground">
          The link may have expired or the owner stopped sharing it.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/">Go to Mnemo</Link>
        </Button>
      </div>
    </div>
  );
}
