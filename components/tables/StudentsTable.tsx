"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import EditModal from "@/components/EditModal";
import { updateStudent } from "@/app/students/actions";

type CoordinatorOption = { id: string; name: string };

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  city: string | null;
  street: string | null;
  birth_date: string | null;
  id_number: number | null;
  phone: string | null;
  father_name: string | null;
  yeshiva: string | null;
  track: string | null;
  enrollment_date: string | null;
  coordinator_id: string | null;
  nedarim_id: number | null;
  notes: string | null;
  coordinator?: { id: string; name: string } | null;
};

type ScoreStats = { total: number; count: number; attended: number; sessions: number };

interface Props {
  students: Student[];
  coordinators: CoordinatorOption[];
  scoreMap: Record<string, ScoreStats>;
}

type FormState = {
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  street: string;
  birth_date: string;
  id_number: string;
  father_name: string;
  yeshiva: string;
  track: string;
  enrollment_date: string;
  coordinator_id: string;
  nedarim_id: string;
  notes: string;
};

function toForm(s: Student): FormState {
  return {
    first_name: s.first_name ?? "",
    last_name: s.last_name ?? "",
    phone: s.phone ?? "",
    city: s.city ?? "",
    street: s.street ?? "",
    birth_date: s.birth_date?.slice(0, 10) ?? "",
    id_number: s.id_number?.toString() ?? "",
    father_name: s.father_name ?? "",
    yeshiva: s.yeshiva ?? "",
    track: s.track ?? "",
    enrollment_date: s.enrollment_date?.slice(0, 10) ?? "",
    coordinator_id: s.coordinator_id ?? "",
    nedarim_id: s.nedarim_id?.toString() ?? "",
    notes: s.notes ?? "",
  };
}

export default function StudentsTable({ students, coordinators, scoreMap }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  function openEdit(student: Student) {
    setEditing(student);
    setForm(toForm(student));
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
      await updateStudent(editing.id, {
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        phone: form.phone || null,
        city: form.city || null,
        street: form.street || null,
        birth_date: form.birth_date || null,
        id_number: form.id_number ? Number(form.id_number) : null,
        father_name: form.father_name || null,
        yeshiva: form.yeshiva || null,
        track: form.track || null,
        enrollment_date: form.enrollment_date || null,
        coordinator_id: form.coordinator_id || null,
        nedarim_id: form.nedarim_id ? Number(form.nedarim_id) : null,
        notes: form.notes || null,
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
              <th className="text-right px-6 py-4 font-semibold text-gray-600">שם</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">רכז</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">עיר</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">ישיבה</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">מסלול</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">נוכחות</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">ציון ממוצע</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.length > 0 ? (
              students.map((student) => {
                const stats = scoreMap[student.id];
                const avgScore =
                  stats && stats.count > 0
                    ? (stats.total / stats.count).toFixed(1)
                    : "—";
                const attendance =
                  stats && stats.sessions > 0
                    ? Math.round((stats.attended / stats.sessions) * 100) + "%"
                    : "—";
                const coordinator = student.coordinator as { name: string } | null;
                return (
                  <tr
                    key={student.id}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    onClick={() => openEdit(student)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600" onClick={(e) => e.stopPropagation()}>
                      {coordinator ? (
                        <Link
                          href={`/coordinators/${student.coordinator_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {coordinator.name}
                        </Link>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{student.city ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-600">{student.yeshiva ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-600">{student.track ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-600">{attendance}</td>
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
                      <Link
                        href={`/students/${student.id}`}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-xs"
                      >
                        פרופיל
                        <ChevronLeft size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-gray-400">
                  אין בחורים להצגה
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && form && (
        <EditModal
          title={`עריכת ${editing.first_name} ${editing.last_name}`}
          onClose={closeEdit}
          onSave={handleSave}
          isSaving={isPending}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">שם פרטי</label>
              <input
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">שם משפחה</label>
              <input
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">טלפון</label>
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">ת.ז</label>
              <input
                type="number"
                value={form.id_number}
                onChange={(e) => set("id_number", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">עיר</label>
              <input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">רחוב</label>
              <input
                value={form.street}
                onChange={(e) => set("street", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">תאריך לידה</label>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => set("birth_date", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">תאריך הצטרפות</label>
              <input
                type="date"
                value={form.enrollment_date}
                onChange={(e) => set("enrollment_date", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">שם האב</label>
              <input
                value={form.father_name}
                onChange={(e) => set("father_name", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">נדרים ID</label>
              <input
                type="number"
                value={form.nedarim_id}
                onChange={(e) => set("nedarim_id", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-gray-500">ישיבה</label>
              <input
                value={form.yeshiva}
                onChange={(e) => set("yeshiva", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">מסלול</label>
              <input
                value={form.track}
                onChange={(e) => set("track", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">רכז</label>
              <select
                value={form.coordinator_id}
                onChange={(e) => set("coordinator_id", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">ללא רכז</option>
                {coordinators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-gray-500">הערות</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
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
