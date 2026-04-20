"use client";

import { useCountUp } from "@/lib/use-count-up";

export function StatValue({
  value,
  suffix,
  className,
  duration = 900,
}: {
  value: number;
  suffix?: string;
  className?: string;
  duration?: number;
}) {
  const shown = useCountUp(value, { duration });
  return (
    <span className={className}>
      {Math.round(shown)}
      {suffix}
    </span>
  );
}
