"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders now, fills in later.
 *
 * A server component can hand a client component a promise it never awaited.
 * The screen is sent as soon as the rest of the data is ready, and this hook
 * swaps in the slow part when it lands — so a table that only needs a few
 * Airtable pages isn't held back by an aggregate that needs a hundred.
 *
 * Returns the value plus whether it is still on its way.
 */
export function useStreamedValue<T>(promise: Promise<T>, initial: T): [T, boolean] {
  const [value, setValue] = useState<T | null>(null);
  const fallback = useRef(initial);
  fallback.current = initial;

  useEffect(() => {
    let alive = true;
    promise.then(
      (resolved) => alive && setValue(resolved),
      () => alive && setValue(fallback.current)
    );
    return () => {
      alive = false;
    };
  }, [promise]);

  return value === null ? [initial, true] : [value, false];
}
