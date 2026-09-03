"use client";

import { useTransition } from "react";
import { CalendarRange, Loader2 } from "lucide-react";
import { setExamZmanAction } from "../actions";

type ZmanOption = { id: string; name: string };

export default function ExamZmanSelect({
  examId,
  zmanId,
  zmanim,
}: {
  examId: string;
  zmanId: string | null;
  zmanim: ZmanOption[];
}) {
  const [saving, startSaving] = useTransition();

  return (
    <label className="inline-flex items-center gap-2 mt-2 text-sm text-gray-500">
      <CalendarRange size={14} className="text-gray-400" />
      <span>זמן:</span>
      <select
        value={zmanId ?? ""}
        disabled={saving}
        onChange={(e) => {
          const next = e.target.value || null;
          if (next === zmanId) return;
          startSaving(async () => {
            await setExamZmanAction(examId, next);
          });
        }}
        className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
      >
        <option value="">ללא זמן</option>
        {zmanim.map((z) => (
          <option key={z.id} value={z.id}>
            {z.name}
          </option>
        ))}
      </select>
      {saving && <Loader2 size={14} className="animate-spin text-gray-400" />}
    </label>
  );
}
