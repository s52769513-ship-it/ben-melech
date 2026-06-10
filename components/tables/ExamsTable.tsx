"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, BarChart2, ChevronLeft } from "lucide-react";
import EditModal from "@/components/EditModal";
import { updateExam } from "@/app/exams/actions";

type Exam = {
  id: string;
  parasha: string;
  exam_date: string | null;
  results: string | null;
  participation_rate: number | null;
};

type ExamStats = { total: number; count: number; participants: number };

type FormState = {
  parasha: string;
  exam_date: string;
  results: string;
  participation_rate: string;
};

interface Props {
  exams: Exam[];
  examStatsMap: Record<string, ExamStats>;
}

function toForm(e: Exam): FormState {
  return {
    parasha: e.parasha ?? "",
    exam_date: e.exam_date?.slice(0, 10) ?? "",
    results: e.results ?? "",
    participation_rate: e.participation_rate?.toString() ?? "",
  };
}

export default function ExamsTable({ exams, examStatsMap }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Exam | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  function openEdit(exam: Exam) {
    setEditing(exam);
    setForm(toForm(exam));
  }

  function closeEdit() {
    setEditing(null);
    setForm(null);
  }

  function set(field: keyof FormState, value: string) {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  function handleSave() {
    if (!editing || !form) return;
    startTransition(async () => {
      await updateExam(editing.id, {
        parasha: form.parasha || null,
        exam_date: form.exam_date || null,
        results: form.results || null,
        participation_rate: form.participation_rate ? Number(form.participation_rate) : null,
      });
      closeEdit();
      router.refresh();
    });
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">פרשה</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">תאריך</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">משתתפים</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">שיעור השתתפות</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">ציון ממוצע</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {exams.length > 0 ? (
              exams.map((exam) => {
                const stats = examStatsMap[exam.id];
                const avgScore =
                  stats && stats.count > 0
                    ? (stats.total / stats.count).toFixed(1)
                    : "—";
                const participationRate =
                  exam.participation_rate != null
                    ? `${exam.participation_rate}%`
                    : stats?.participants
                    ? `${stats.participants} בחורים`
                    : "—";

                return (
                  <tr
                    key={exam.id}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    onClick={() => router.push(`/exams/${exam.id}`)}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">{exam.parasha}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {exam.exam_date ? (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-gray-400" />
                          {new Date(exam.exam_date).toLocaleDateString("he-IL")}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{stats?.participants ?? 0}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <BarChart2 size={13} className="text-gray-400" />
                        {participationRate}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {avgScore !== "—" ? (
                        <span className="bg-blue-50 text-blue-700 font-semibold text-xs px-2.5 py-1 rounded-full">
                          {avgScore}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEdit(exam)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
                        title="עריכת פרטי מבחן"
                      >
                        <ChevronLeft size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                  אין מבחנים במערכת
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && form && (
        <EditModal
          title={`עריכת מבחן: ${editing.parasha}`}
          onClose={closeEdit}
          onSave={handleSave}
          isSaving={isPending}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-gray-500">פרשה</label>
              <input
                value={form.parasha}
                onChange={(e) => set("parasha", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">תאריך</label>
              <input
                type="date"
                value={form.exam_date}
                onChange={(e) => set("exam_date", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">שיעור השתתפות (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.participation_rate}
                onChange={(e) => set("participation_rate", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-gray-500">תוצאות / הערות</label>
              <textarea
                value={form.results}
                onChange={(e) => set("results", e.target.value)}
                rows={3}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>
          </div>
        </EditModal>
      )}
    </>
  );
}
