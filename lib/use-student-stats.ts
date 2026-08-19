"use client";

import { useEffect, useState } from "react";

export type StudentStats = {
  total: number;
  count: number;
  attended: number;
  sessions: number;
};

const EMPTY: Record<string, StudentStats> = {};

// Shared across the screen so two tables on one page don't both ask.
let inFlight: Promise<Record<string, StudentStats>> | null = null;

function load() {
  inFlight ??= fetch("/api/student-stats")
    .then((r) => (r.ok ? r.json() : EMPTY))
    .catch(() => EMPTY);
  return inFlight;
}

/**
 * Attendance rate and average grade per bochur.
 *
 * These are aggregated over every score in the base — the one read that has to
 * walk the whole table. Fetching it here rather than on the server means the
 * list is on screen and interactive first, and the two derived columns fill in
 * after. Pass `enabled: false` when the columns are hidden and it never runs.
 */
export function useStudentStats(enabled = true): [Record<string, StudentStats>, boolean] {
  const [stats, setStats] = useState<Record<string, StudentStats> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    load().then((value) => alive && setStats(value));
    return () => {
      alive = false;
    };
  }, [enabled]);

  return stats === null ? [EMPTY, enabled] : [stats, false];
}
