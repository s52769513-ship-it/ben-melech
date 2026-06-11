"use client";

import { useOptimistic, useTransition, useState, useCallback } from "react";
import { updateScoreAction } from "./actions";

type Score = {
  id: string;
  chassidut_score: number | null;
  halacha_score: number | null;
  tefila_score: number | null;
  beinoni_score: number | null;
  shleimut_score: number | null;
  attended_seder: boolean;
  arrived_on_time: boolean;
  attended_class: boolean;
  paid: boolean;
  personal_note: string | null;
  student: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
};

interface Props {
  scores: Score[];
  examId: string;
}

type EditingCell = { scoreId: string; field: string } | null;

function NumCell({
  scoreId,
  field,
  value,
  editing,
  onEdit,
  onSave,
}: {
  scoreId: string;
  field: string;
  value: number | null;
  editing: EditingCell;
  onEdit: (scoreId: string, field: string) => void;
  onSave: (scoreId: string, field: string, value: unknown) => void;
}) {
  const isEditing = editing?.scoreId === scoreId && editing?.field === field;

  if (isEditing) {
    return (
      <input
        type="number"
        min="0"
        max="100"
        defaultValue={value ?? ""}
        autoFocus
        className="w-14 text-center text-sm border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
        onBlur={(e) => {
          const v = e.target.value === "" ? null : Number(e.target.value);
          onSave(scoreId, field, v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") onSave(scoreId, field, value);
        }}
      />
    );
  }

  return (
    <span
      onClick={() => onEdit(scoreId, field)}
      className="cursor-pointer hover:bg-blue-50 rounded px-2 py-0.5 min-w-[2.5rem] inline-block text-center transition-colors"
      title="לחץ לעריכה"
    >
      {value ?? <span className="text-gray-300">—</span>}
    </span>
  );
}

function BoolCell({
  value,
  onToggle,
}: {
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all active:scale-90 ${
        value
          ? "bg-green-100 text-green-600 hover:bg-green-200"
          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
      }`}
    >
      {value ? "✓" : "✗"}
    </button>
  );
}

export default function ExamScoresClient({ scores: initialScores, examId }: Props) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<EditingCell>(null);

  const [scores, updateOptimistic] = useOptimistic(
    initialScores,
    (state: Score[], update: { id: string; patch: Partial<Score> }) =>
      state.map((s) => (s.id === update.id ? { ...s, ...update.patch } : s))
  );

  const save = useCallback(
    (scoreId: string, field: string, value: unknown) => {
      setEditing(null);
      startTransition(async () => {
        updateOptimistic({ id: scoreId, patch: { [field]: value } as Partial<Score> });
        await updateScoreAction(scoreId, { [field]: value }, examId);
      });
    },
    [updateOptimistic, examId]
  );

  const toggle = useCallback(
    (scoreId: string, field: keyof Score, current: boolean) => {
      save(scoreId, field, !current);
    },
    [save]
  );

  if (scores.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        אין בחורים משויכים אליך במבחן זה
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="text-right px-4 py-3.5 font-semibold text-gray-600">בחור</th>
            <th className="text-center px-3 py-3.5 font-semibold text-gray-600">חסידות</th>
            <th className="text-center px-3 py-3.5 font-semibold text-gray-600">הלכה</th>
            <th className="text-center px-3 py-3.5 font-semibold text-gray-600">תפילה</th>
            <th className="text-center px-3 py-3.5 font-semibold text-gray-600">בינוני</th>
            <th className="text-center px-3 py-3.5 font-semibold text-gray-600">שלמות</th>
            <th className="text-center px-3 py-3.5 font-semibold text-gray-600">נוכח</th>
            <th className="text-center px-3 py-3.5 font-semibold text-gray-600">בזמן</th>
            <th className="text-center px-3 py-3.5 font-semibold text-gray-600">שיעור</th>
            <th className="text-center px-3 py-3.5 font-semibold text-gray-600">שילם</th>
            <th className="text-center px-3 py-3.5 font-semibold text-gray-600">ממוצע</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {scores.map((score) => {
            const vals = [
              score.chassidut_score,
              score.halacha_score,
              score.tefila_score,
            ].filter((v): v is number => v !== null);
            const avg =
              vals.length > 0
                ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
                : null;

            return (
              <tr key={score.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {score.student
                    ? `${score.student.first_name} ${score.student.last_name}`
                    : "—"}
                </td>
                <td className="px-3 py-3 text-center">
                  <NumCell
                    scoreId={score.id}
                    field="chassidut_score"
                    value={score.chassidut_score}
                    editing={editing}
                    onEdit={(id, f) => setEditing({ scoreId: id, field: f })}
                    onSave={save}
                  />
                </td>
                <td className="px-3 py-3 text-center">
                  <NumCell
                    scoreId={score.id}
                    field="halacha_score"
                    value={score.halacha_score}
                    editing={editing}
                    onEdit={(id, f) => setEditing({ scoreId: id, field: f })}
                    onSave={save}
                  />
                </td>
                <td className="px-3 py-3 text-center">
                  <NumCell
                    scoreId={score.id}
                    field="tefila_score"
                    value={score.tefila_score}
                    editing={editing}
                    onEdit={(id, f) => setEditing({ scoreId: id, field: f })}
                    onSave={save}
                  />
                </td>
                <td className="px-3 py-3 text-center">
                  <NumCell
                    scoreId={score.id}
                    field="beinoni_score"
                    value={score.beinoni_score}
                    editing={editing}
                    onEdit={(id, f) => setEditing({ scoreId: id, field: f })}
                    onSave={save}
                  />
                </td>
                <td className="px-3 py-3 text-center">
                  <NumCell
                    scoreId={score.id}
                    field="shleimut_score"
                    value={score.shleimut_score}
                    editing={editing}
                    onEdit={(id, f) => setEditing({ scoreId: id, field: f })}
                    onSave={save}
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-center">
                    <BoolCell
                      value={score.attended_seder}
                      onToggle={() => toggle(score.id, "attended_seder", score.attended_seder)}
                    />
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-center">
                    <BoolCell
                      value={score.arrived_on_time}
                      onToggle={() => toggle(score.id, "arrived_on_time", score.arrived_on_time)}
                    />
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-center">
                    <BoolCell
                      value={score.attended_class}
                      onToggle={() => toggle(score.id, "attended_class", score.attended_class)}
                    />
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-center">
                    <BoolCell
                      value={score.paid}
                      onToggle={() => toggle(score.id, "paid", score.paid)}
                    />
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  {avg ? (
                    <span className="bg-blue-50 text-blue-700 font-semibold text-xs px-2 py-0.5 rounded-full">
                      {avg}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
