"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Plus, X } from "lucide-react";
import EditModal from "@/components/EditModal";
import { updateInquiry, createInquiryAction } from "@/app/inquiries/actions";

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
  coordinator?: { id: string; name: string } | null;
  student?: { id: string; first_name: string; last_name: string } | null;
};

type EditForm = {
  title: string; status: string; coordinator_id: string; student_id: string;
  inquiry_date: string; description: string; target_date: string;
  close_date: string; cancel_reminder: boolean;
};

type CreateForm = {
  title: string; student_id: string; inquiry_date: string;
  target_date: string; description: string;
};

interface Props {
  inquiries: Inquiry[];
  coordinators: CoordinatorOption[];
  students: StudentOption[];
  isAdmin?: boolean;
}

const statusColors: Record<string, { badge: string; row: string }> = {
  חדש:   { badge: "bg-red-100 text-red-700",    row: "border-r-4 border-red-400" },
  פתוח:  { badge: "bg-red-100 text-red-700",    row: "border-r-4 border-red-400" },
  בטיפול:{ badge: "bg-yellow-100 text-yellow-700", row: "border-r-4 border-yellow-400" },
  סגור:  { badge: "bg-green-100 text-green-700", row: "" },
};

function getDaysOpen(createdAt: string, status: string) {
  if (status === "סגור") return null;
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

const emptyCreate = (): CreateForm => ({
  title: "",
  student_id: "",
  inquiry_date: new Date().toISOString().slice(0, 10),
  target_date: "",
  description: "",
});

export default function InquiriesTable({ inquiries, coordinators, students, isAdmin }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Inquiry | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate());
  const [createError, setCreateError] = useState("");

  // ── Edit ──────────────────────────────────────────────────────────────────
  function openEdit(inq: Inquiry) {
    setEditing(inq);
    setEditForm({
      title: inq.title ?? "", status: inq.status ?? "חדש",
      coordinator_id: inq.coordinator_id ?? "", student_id: inq.student_id ?? "",
      inquiry_date: inq.inquiry_date?.slice(0, 10) ?? "",
      description: inq.description ?? "", target_date: inq.target_date?.slice(0, 10) ?? "",
      close_date: inq.close_date?.slice(0, 10) ?? "", cancel_reminder: inq.cancel_reminder ?? false,
    });
  }

  function closeEdit() { setEditing(null); setEditForm(null); }

  function setE(field: keyof EditForm, value: string | boolean) {
    setEditForm((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  function handleSave() {
    if (!editing || !editForm) return;
    startTransition(async () => {
      await updateInquiry(editing.id, {
        title: editForm.title || null, status: editForm.status,
        coordinator_id: editForm.coordinator_id || null, student_id: editForm.student_id || null,
        inquiry_date: editForm.inquiry_date || null, description: editForm.description || null,
        target_date: editForm.target_date || null, close_date: editForm.close_date || null,
        cancel_reminder: editForm.cancel_reminder,
      });
      closeEdit();
      router.refresh();
    });
  }

  // ── Create ────────────────────────────────────────────────────────────────
  function openCreate() { setCreateForm(emptyCreate()); setCreateError(""); setCreating(true); }
  function closeCreate() { setCreating(false); setCreateError(""); }

  function setC(field: keyof CreateForm, value: string) {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleCreate() {
    if (!createForm.title.trim()) { setCreateError("יש להזין כותרת"); return; }
    startTransition(async () => {
      await createInquiryAction({
        title: createForm.title.trim(),
        student_id: createForm.student_id || null,
        inquiry_date: createForm.inquiry_date || null,
        target_date: createForm.target_date || null,
        description: createForm.description || null,
      });
      closeCreate();
      router.refresh();
    });
  }

  const inputCls = "text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 w-full";

  return (
    <>
      {/* ── New inquiry button ────────────────────────────────────────────── */}
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#1e3a5f] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#2d4f7f] transition-colors shadow-sm"
        >
          <Plus size={16} />
          פניה חדשה
        </button>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">כותרת</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">בחור</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">משפיע</th>
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
                          <p className="text-xs text-gray-400 mt-0.5 font-normal line-clamp-1">{inq.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600" onClick={(e) => e.stopPropagation()}>
                      {student ? (
                        <Link href={`/students/${student.id}`} className="text-blue-600 hover:underline">
                          {student.first_name} {student.last_name}
                        </Link>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600" onClick={(e) => e.stopPropagation()}>
                      {coordinator ? (
                        <Link href={`/coordinators/${coordinator.id}`} className="text-blue-600 hover:underline">
                          {coordinator.name}
                        </Link>
                      ) : <span className="text-gray-300">—</span>}
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
                      ) : <span className="text-gray-300">—</span>}
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
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400">אין פניות להצגה</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create modal ──────────────────────────────────────────────────── */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#1e3a5f]">פניה חדשה</h2>
              <button onClick={closeCreate} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  כותרת <span className="text-red-400">*</span>
                </label>
                <input
                  value={createForm.title}
                  onChange={(e) => setC("title", e.target.value)}
                  placeholder="תאר בקצרה את הנושא..."
                  className={inputCls}
                  autoFocus
                />
                {createError && <p className="text-red-500 text-xs">{createError}</p>}
              </div>

              {/* Student */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">בחור</label>
                <select
                  value={createForm.student_id}
                  onChange={(e) => setC("student_id", e.target.value)}
                  className={inputCls}
                >
                  <option value="">— ללא בחור ספציפי —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">תיאור</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setC("description", e.target.value)}
                  placeholder="פרט את הנושא..."
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">תאריך פנייה</label>
                  <input
                    type="date"
                    value={createForm.inquiry_date}
                    onChange={(e) => setC("inquiry_date", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">תאריך יעד</label>
                  <input
                    type="date"
                    value={createForm.target_date}
                    onChange={(e) => setC("target_date", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={closeCreate}
                disabled={isPending}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                ביטול
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending}
                className="flex items-center gap-2 bg-[#1e3a5f] text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-[#2d4f7f] transition-colors disabled:opacity-50 shadow-sm"
              >
                {isPending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    שומר...
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    פתיחת פנייה
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal ────────────────────────────────────────────────────── */}
      {editing && editForm && (
        <EditModal
          title={`עריכת פנייה: ${editing.title}`}
          onClose={closeEdit}
          onSave={handleSave}
          isSaving={isPending}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-gray-500">כותרת</label>
              <input value={editForm.title} onChange={(e) => setE("title", e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">סטטוס</label>
              <select value={editForm.status} onChange={(e) => setE("status", e.target.value)} className={inputCls}>
                <option value="חדש">חדש</option>
                <option value="פתוח">פתוח</option>
                <option value="בטיפול">בטיפול</option>
                <option value="סגור">סגור</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">בחור</label>
              <select value={editForm.student_id} onChange={(e) => setE("student_id", e.target.value)} className={inputCls}>
                <option value="">ללא בחור</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </select>
            </div>
            {isAdmin && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">משפיע</label>
                <select value={editForm.coordinator_id} onChange={(e) => setE("coordinator_id", e.target.value)} className={inputCls}>
                  <option value="">ללא משפיע</option>
                  {coordinators.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">תאריך פנייה</label>
              <input type="date" value={editForm.inquiry_date} onChange={(e) => setE("inquiry_date", e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">תאריך יעד</label>
              <input type="date" value={editForm.target_date} onChange={(e) => setE("target_date", e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">תאריך סגירה</label>
              <input type="date" value={editForm.close_date} onChange={(e) => setE("close_date", e.target.value)} className={inputCls} />
            </div>
            <div className="flex items-center gap-2 col-span-2 pt-1">
              <input
                type="checkbox" id="cancel_reminder"
                checked={editForm.cancel_reminder}
                onChange={(e) => setE("cancel_reminder", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="cancel_reminder" className="text-sm text-gray-600">ביטול תזכורת</label>
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-gray-500">תיאור</label>
              <textarea value={editForm.description} onChange={(e) => setE("description", e.target.value)} rows={2} className={`${inputCls} resize-none`} />
            </div>
          </div>
        </EditModal>
      )}
    </>
  );
}
