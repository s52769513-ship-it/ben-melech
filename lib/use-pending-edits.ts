"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Keeps a just-saved row on screen until the server agrees with it.
 *
 * The scores table is large enough that re-reading it on every tick would stall
 * the click, so a write refreshes it in the background instead. That means the
 * render right after a save can still carry the old value — this overlay holds
 * the edited fields over it, and drops them as soon as the server reports the
 * same value.
 */
export function usePendingEdits<T extends { id: string }>(rows: T[]) {
  const [edits, setEdits] = useState<Record<string, Partial<T>>>({});

  const merged = useMemo(() => {
    if (Object.keys(edits).length === 0) return rows;
    return rows.map((row) => (edits[row.id] ? { ...row, ...edits[row.id] } : row));
  }, [rows, edits]);

  useEffect(() => {
    setEdits((prev) => {
      const ids = Object.keys(prev);
      if (ids.length === 0) return prev;

      const settled = new Set<string>();
      for (const row of rows) {
        const patch = prev[row.id];
        if (!patch) continue;
        const matches = Object.entries(patch).every(
          ([field, value]) => row[field as keyof T] === value
        );
        if (matches) settled.add(row.id);
      }
      if (settled.size === 0) return prev;

      const next: Record<string, Partial<T>> = {};
      for (const id of ids) if (!settled.has(id)) next[id] = prev[id];
      return next;
    });
  }, [rows]);

  function applyEdit(id: string, patch: Partial<T>) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  return [merged, applyEdit] as const;
}
