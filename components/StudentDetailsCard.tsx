"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Pencil, X, Check, BookOpen, Phone, MapPin, Calendar, CreditCard, Hash } from "lucide-react";
import { updateStudent } from "@/app/students/actions";

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
  group_id: string | null;
  notes: string | null;
};

type CoordinatorOption = { id: string; name: string };

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

interface Props {
  student: Student;
  coordinator: { id: string; name: string } | null;
  coordinators: CoordinatorOption[];
}

const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white";
const labelCls = "text-xs font-medium text-gray-400 mb-0.5 block";

export default function StudentDetailsCard({ student, coordinator, coordinators }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(toForm(student));

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleCancel() {
    setForm(toForm(student));
    setEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      await updateStudent(student.id, {
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
      setEditing(false);
      router.refresh();
    });
  }

  const selectedCoordinator = coordinators.find((c) => c.id === (editing ? form.coordinator_id : student.coordinator_id));

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <User size={18} />
            פרטים אישיים
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              <X size={13} /> ביטול
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#1e3a5f] text-white hover:bg-[#2d4f7f] disabled:opacity-50"
            >
              <Check size={13} /> {isPending ? "שומר..." : "שמור"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>שם פרטי</label>
              <input className={inputCls} value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>שם משפחה</label>
              <input className={inputCls} value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelCls}>טלפון</label>
            <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>עיר</label>
              <input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>רחוב</label>
              <input className={inputCls} value={form.street} onChange={(e) => set("street", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>תאריך לידה</label>
              <input type="date" className={inputCls} value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>ת.ז</label>
              <input type="number" className={inputCls} value={form.id_number} onChange={(e) => set("id_number", e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelCls}>שם האב</label>
            <input className={inputCls} value={form.father_name} onChange={(e) => set("father_name", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>ישיבה</label>
              <input className={inputCls} value={form.yeshiva} onChange={(e) => set("yeshiva", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>מסלול</label>
              <input className={inputCls} value={form.track} onChange={(e) => set("track", e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelCls}>תאריך הצטרפות</label>
            <input type="date" className={inputCls} value={form.enrollment_date} onChange={(e) => set("enrollment_date", e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>רכז</label>
            <select className={inputCls} value={form.coordinator_id} onChange={(e) => set("coordinator_id", e.target.value)}>
              <option value="">ללא רכז</option>
              {coordinators.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>נדרים ID</label>
            <input type="number" className={inputCls} value={form.nedarim_id} onChange={(e) => set("nedarim_id", e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>הערות</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
          <User size={18} />
          פרטים אישיים
        </h2>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#1e3a5f] transition-colors"
        >
          <Pencil size={12} /> עריכה
        </button>
      </div>

      <dl className="space-y-3 text-sm">
        {(student.city || student.street) && (
          <div className="flex items-start gap-2 text-gray-600">
            <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
            <span>
              {student.city}{student.street ? `, ${student.street}` : ""}
            </span>
          </div>
        )}
        {student.phone && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone size={14} className="text-gray-400 shrink-0" />
            <span>{student.phone}</span>
          </div>
        )}
        {student.birth_date && (
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            <span>{new Date(student.birth_date).toLocaleDateString("he-IL")}</span>
          </div>
        )}
        {student.id_number && (
          <div className="flex items-center gap-2 text-gray-600">
            <CreditCard size={14} className="text-gray-400 shrink-0" />
            <span>ת.ז: {student.id_number}</span>
          </div>
        )}
        {student.father_name && (
          <div className="text-gray-600">
            <span className="text-gray-400 text-xs">שם האב: </span>
            {student.father_name}
          </div>
        )}
        {student.enrollment_date && (
          <div className="text-gray-600">
            <span className="text-gray-400 text-xs">תאריך הצטרפות: </span>
            {new Date(student.enrollment_date).toLocaleDateString("he-IL")}
          </div>
        )}
        {student.nedarim_id && (
          <div className="flex items-center gap-2 text-gray-600">
            <Hash size={14} className="text-gray-400 shrink-0" />
            <span>נדרים: {student.nedarim_id}</span>
          </div>
        )}

        {!student.city && !student.phone && !student.birth_date && !student.id_number && !student.father_name && !student.enrollment_date && (
          <p className="text-gray-300 text-xs">אין פרטים — לחץ עריכה להוסיף</p>
        )}
      </dl>

      {(student.yeshiva || student.track) && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <BookOpen size={14} />
            לימודים
          </h3>
          <dl className="space-y-2 text-sm text-gray-600">
            {student.yeshiva && (
              <div>
                <span className="text-gray-400 text-xs">ישיבה: </span>
                {student.yeshiva}
              </div>
            )}
            {student.track && (
              <div>
                <span className="text-gray-400 text-xs">מסלול: </span>
                {student.track}
              </div>
            )}
          </dl>
        </div>
      )}

      {coordinator && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">רכז</h3>
          <Link
            href={`/coordinators/${coordinator.id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            {coordinator.name}
          </Link>
        </div>
      )}

      {student.notes && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">הערות</h3>
          <p className="text-sm text-gray-600">{student.notes}</p>
        </div>
      )}
    </div>
  );
}
