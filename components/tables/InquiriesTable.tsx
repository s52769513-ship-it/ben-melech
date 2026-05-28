"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock } from "lucide-react";
import EditModal from "@/components/EditModal";
import { updateInquiry } from "@/app/inquiries/actions";

type CoordinatorOption = { id: string; name: string };
type StudentOption = { id: string; first_name: string; last_name: string };

type Inquiry = {
  id: string;
  created_at: string;
  title: string;
  coordinator_id: string | null;
  student_id: string | null;
  status: string;
  inquiry_date: string | null;
  description: string | null;
  target_date: string | null;
  close_date: string | null;
  cancel_reminder: boolean;
  summary: string | null;
  category: string | null;
  coordinator?: { id: string; name: string } | null;
  student?: { id: string; first_name: string; last_name: string } | null;
};

type FormState = {
  title: string;
  status: string;
  coordinator_id: string;
  student_id: string;
  inquiry_date: string;
  description: string;
  target_date: string;
  close_date: string;
  cancel_reminder: boolean;
  summary: string;
  category: string;
};

interface Props {
  inquiries: Inquiry[];
  coordinators: CoordinatorOption[];
  students: StudentOption[];
}

const statusColors: Record<string, { badge: string; row: string }> = {
  פתוח: { badge: "bg-red-100 text-red-700", row: "border-r-4 border-red-400" },
  בטיפול: { badge: "bg-yellow-100 text-yellow-700", row: "border-r-4 border-yellow-400" },
  סגור: { badge: "bg-green-100 text-green-700", row: "" },
};

function toForm(inq: Inquiry): FormState {
  return {
    title: inq.title ?? "",
    status: inq.status ?? "פתוח",
    coordinator_id: inq.coordinator_id ?? "",
    student_id: inq.student_id ?? "",
    inquiry_date: inq.inquiry_date?.slice(0, 10) ?? "",
    description: inq.description ?? "",
    target_date: inq.target_date?.slice(0, 10) ?? "",
    close_date: inq.close_date?.slice(0, 10) ?? "",
    cancel_reminder: inq.cancel_reminder ?? false,
    summary: inq.summary ?? "",
    category: inq.category ?? "",
  };
}

function getDaysOpen(createdAt: string, status: string) {
  if (status === "סגור") return null;
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

export default function InquiriesTable({ inquiries, coordinators, students }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Inquiry | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  function openEdit(inq: Inquiry) {
    setEditing(inq);
    setForm(toForm(inq));
  }

  function closeEdit() {
    setEditing(null);
    setForm(null);
  }

  function set(field: keyof FormState, value: string | boolean) {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  function handleSave() {
    if (!editing || !form) return;
    startTransition(async () => {
      await updateInquiry(editing.id, {
        title: form.title || null,
        status: form.status,
        coordinator_id: form.coordinator_id || null,
        student_id: form.student_id || null,
        inquiry_date: form.inquiry_date || null,
        description: form.description || null,
        target_date: form.target_date || null,
        close_date: form.close_date || null,
        cancel_reminder: form.cancel_reminder,
        summary: form.summary || null,
        category: form.category || null,
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
              <th className="text-right px-6 py-4 font-semibold text-gray-600">כותרת</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">בחור</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">משפיע</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">קטגוריה</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">תאריך פתיחה</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">ימים פתוח</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">סטטוס</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inquiries.length > 0 ? (
              inquiries.map((inq) => {
                const student = inq.student as { id: string; first_name: string; last_name: string } | null;
                const coordinator = inq.coordinator as { id: string; name: string } | null;
                const daysOpen = getDaysOpen(inq.created_at, inq.status);
                const colors = statusColors[inq.status] ?? { badge: "bg-gray-100 text-gray-600", row: "" };

                return (
                  <tr
                    key={inq.id}
                    className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${colors.row}`}
                    onClick={() => openEdit(inq)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div>
                        {inq.title}
                        {inq.description && (
                          <p className="text-xs text-gray-400 mt-0.5 font-normal line-clamp-1">
                            {inq.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600" onClick={(e) => e.stopPropagation()}>
                      {student ? (
                        <Link href={`/students/${student.id}`} className="text-blue-600 hover:underline">
                          {student.first_name} {student.last_name}
                        </Link>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600" onClick={(e) => e.stopPropagation()}>
                      {coordinator ? (
                        <Link href={`/coordinators/${coordinator.id}`} className="text-blue-600 hover:underline">
                          {coordinator.name}
                        </Link>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {inq.category ? (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                          {inq.category}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {inq.inquiry_date
                        ? new Date(inq.inquiry_date).toLocaleDateString("he-IL")
                        : new Date(inq.created_at).toLocaleDateString("he-IL")}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {daysOpen !== null ? (
                        <span className={`flex items-center gap-1 text-xs font-medium ${
                          daysOpen > 14 ? "text-red-600" : daysOpen > 7 ? "text-orange-600" : "text-gray-600"
                        }`}>
                          <Clock size={12} />
                          {daysOpen} ימים
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors.badge}`}>
                        {inq.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                  אין פניות להצגה
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && form && (
        <EditModal
          title={`עריכת פנייה: ${editing.title}`}
          onClose={closeEdit}
          onSave={handleSave}
          isSaving={isPending}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-gray-500">כותרת</label>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">סטטוס</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="פתוח">פתוח</option>
                <option value="בטיפול">בטיפול</option>
                <option value="סגור">סגור</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">קטגוריה</label>
              <input
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">בחור</label>
              <select
                value={form.student_id}
                onChange={(e) => set("student_id", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">ללא בחור</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">משפיע</label>
              <select
                value={form.coordinator_id}
                onChange={(e) => set("coordinator_id", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">ללא משפיע</option>
                {coordinators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">תאריך פנייה</label>
              <input
                type="date"
                value={form.inquiry_date}
                onChange={(e) => set("inquiry_date", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">תאריך יעד</label>
              <input
                type="date"
                value={form.target_date}
                onChange={(e) => set("target_date", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">תאריך סגירה</label>
              <input
                type="date"
                value={form.close_date}
                onChange={(e) => set("close_date", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <input
                type="checkbox"
                id="cancel_reminder"
                checked={form.cancel_reminder}
                onChange={(e) => set("cancel_reminder", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="cancel_reminder" className="text-sm text-gray-600">
                ביטול תזכורת
              </label>
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-gray-500">תיאור</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={2}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-gray-500">סיכום</label>
              <textarea
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
                rows={2}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>
          </div>
        </EditModal>
      )}
    </>
  );
}
