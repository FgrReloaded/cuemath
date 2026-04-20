"use client";

import { useEffect, useRef, useState } from "react";

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

export function useCountUp(
  target: number,
  {
    duration = 900,
    enabled = true,
  }: { duration?: number; enabled?: boolean } = {},
) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const latestRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      latestRef.current = target;
      const id = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(id);
    }

    const from = latestRef.current;
    const delta = target - from;
    let startTime: number | null = null;

    const tick = (t: number) => {
      if (startTime === null) startTime = t;
      const progress = Math.min(1, (t - startTime) / duration);
      const next = from + delta * easeOutQuart(progress);
      latestRef.current = next;
      setValue(next);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, enabled]);

  return enabled ? value : target;
}
