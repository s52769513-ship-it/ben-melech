"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FileSpreadsheet, FileText, Settings, Plus, Users, X } from "lucide-react";
import EditModal from "@/components/EditModal";
import ExportDialog from "@/components/ExportDialog";
import FieldSettingsModal from "@/components/FieldSettingsModal";
import {
  updateStudent,
  createStudentAction,
  reassignCoordinatorAction,
} from "@/app/(app)/students/actions";
import { useSettings } from "@/lib/settings-context";

type CoordinatorOption = { id: string; name: string };
type GroupOption = { id: string; name: string };

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
  nedarim_amount: number | null;
  nedarim_charged: number | null;
  remaining_to_load: number | null;
  summer_points: number | null;
  summer_points_over_500: number | null;
  avg_score: number | null;
  total_exams: number | null;
  total_sedarim: number | null;
  group_id: string | null;
  notes: string | null;
  coordinator?: { id: string; name: string } | null;
};

interface Props {
  students: Student[];
  coordinators: CoordinatorOption[];
  groups: GroupOption[];
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
  group_id: string;
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
    group_id: s.group_id ?? "",
    notes: s.notes ?? "",
  };
}

const CREATE_FIELDS: { key: keyof FormState; label: string; type?: string }[] = [
  { key: "first_name", label: "שם פרטי" },
  { key: "last_name", label: "שם משפחה" },
  { key: "phone", label: "טלפון" },
  { key: "id_number", label: "ת.ז" },
  { key: "father_name", label: "שם האב" },
  { key: "city", label: "עיר" },
  { key: "street", label: "רחוב" },
  { key: "birth_date", label: "תאריך לידה", type: "date" },
  { key: "yeshiva", label: "ישיבה" },
  { key: "track", label: "מסלול" },
  { key: "enrollment_date", label: "תאריך הצטרפות", type: "date" },
  { key: "nedarim_id", label: "מזהה נדרים" },
];

function emptyForm(): FormState {
  return {
    first_name: "", last_name: "", phone: "", city: "", street: "",
    birth_date: "", id_number: "", father_name: "", yeshiva: "", track: "",
    enrollment_date: "", coordinator_id: "", nedarim_id: "", group_id: "", notes: "",
  };
}

type FieldKey = typeof AVAILABLE_FIELDS[number]["id"];

function renderCellValue(fieldId: FieldKey, student: Student, coordinators: CoordinatorOption[], groups: GroupOption[]): React.ReactNode {
  switch (fieldId) {
    case "name":
      return `${student.first_name} ${student.last_name}`;
    case "phone":
      return student.phone ?? "—";
    case "id_number":
      return student.id_number ?? "—";
    case "city":
      return student.city ?? "—";
    case "street":
      return student.street ?? "—";
    case "birth_date":
      return student.birth_date ? student.birth_date.slice(0, 10) : "—";
    case "father_name":
      return student.father_name ?? "—";
    case "yeshiva":
      return student.yeshiva ?? "—";
    case "track":
      return student.track ?? "—";
    case "enrollment_date":
      return student.enrollment_date ? student.enrollment_date.slice(0, 10) : "—";
    case "coordinator": {
      const coordinator = student.coordinator as { name: string } | null;
      return coordinator?.name ?? "—";
    }
    case "group": {
      const group = groups.find((g) => g.id === student.group_id);
      return group?.name ?? "—";
    }
    case "nedarim_id":
      return student.nedarim_id ?? "—";
    case "nedarim_amount":
      return student.nedarim_amount ?? "—";
    case "nedarim_charged":
      return student.nedarim_charged ?? "—";
    case "remaining_to_load":
      return student.remaining_to_load ?? "—";
    case "summer_points":
      return student.summer_points ?? "—";
    case "summer_points_over_500":
      return student.summer_points_over_500 ?? "—";
    // Both come straight off the bochur's row — Airtable keeps them as a
    // rollup and a count, so no score has to be read to show them.
    case "attendance": {
      if (!student.total_exams) return "—";
      return Math.round(((student.total_sedarim ?? 0) / student.total_exams) * 100) + "%";
    }
    case "score":
      return student.avg_score != null ? student.avg_score.toFixed(1) : "—";
    case "notes":
      return student.notes ?? "—";
    default:
      return "—";
  }
}

const AVAILABLE_FIELDS = [
  { id: "name", label: "שם" },
  { id: "phone", label: "טלפון" },
  { id: "id_number", label: "ת.ז" },
  { id: "city", label: "עיר" },
  { id: "street", label: "רחוב" },
  { id: "birth_date", label: "תאריך לידה" },
  { id: "father_name", label: "שם האב" },
  { id: "yeshiva", label: "ישיבה" },
  { id: "track", label: "מסלול" },
  { id: "enrollment_date", label: "תאריך הצטרפות" },
  { id: "coordinator", label: "משפיע" },
  { id: "group", label: "קבוצה" },
  { id: "nedarim_id", label: "נדרים ID" },
  { id: "nedarim_amount", label: "סכום נדרים" },
  { id: "nedarim_charged", label: "נדרים חויבו" },
  { id: "remaining_to_load", label: "נותר להעמסה" },
  { id: "summer_points", label: "נקודות קיץ" },
  { id: "summer_points_over_500", label: "נקודות קיץ מעל 500" },
  { id: "attendance", label: "נוכחות" },
  { id: "score", label: "ציון ממוצע" },
  { id: "notes", label: "הערות" },
];

export default function StudentsTable({ students, coordinators, groups }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // The saved row is painted from the form straight away; the server value
  // takes over when the refresh lands.
  const [rows, applyOptimistic] = useOptimistic(
    students,
    (state: Student[], edited: Student) =>
      state.map((s) => (s.id === edited.id ? edited : s))
  );
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [exportFormat, setExportFormat] = useState<"excel" | "pdf" | null>(null);
  const [showFieldSettings, setShowFieldSettings] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCoordinator, setBulkCoordinator] = useState("");
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm());
  const [createError, setCreateError] = useState("");
  const { settings, isStudentVisible, toggleStudentField, setStudentFieldOrder } = useSettings();
  const visibleStudents = rows.filter(isStudentVisible);
  const visibleCoordinators = coordinators.filter(
    (c) => !settings.hiddenCoordinators.includes(c.id)
  );

  const orderedFields = [...AVAILABLE_FIELDS].sort((a, b) => {
    const aIndex = settings.studentFieldOrder.indexOf(a.id);
    const bIndex = settings.studentFieldOrder.indexOf(b.id);
    return aIndex - bIndex;
  });

  const fieldOptions = orderedFields.map((f) => ({
    ...f,
    isChecked: settings.visibleStudentFields.includes(f.id),
  }));

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
    const student = editing;
    const changes = {
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
      group_id: form.group_id || null,
      notes: form.notes || null,
    };
    closeEdit();
    startTransition(async () => {
      applyOptimistic({
        ...student,
        ...changes,
        first_name: changes.first_name ?? "",
        last_name: changes.last_name ?? "",
        coordinator:
          coordinators.find((c) => c.id === changes.coordinator_id) ?? null,
      });
      await updateStudent(student.id, changes);
      router.refresh();
    });
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === visibleStudents.length
        ? new Set()
        : new Set(visibleStudents.map((s) => s.id))
    );
  }

  function handleReassign() {
    const ids = [...selected];
    if (ids.length === 0) return;
    const coordinatorId = bulkCoordinator || null;
    const coordinator = coordinators.find((c) => c.id === coordinatorId) ?? null;
    setSelected(new Set());
    setBulkCoordinator("");
    startTransition(async () => {
      for (const id of ids) {
        const student = rows.find((s) => s.id === id);
        if (student) applyOptimistic({ ...student, coordinator_id: coordinatorId, coordinator });
      }
      await reassignCoordinatorAction(ids, coordinatorId);
      router.refresh();
    });
  }

  function setC(field: keyof FormState, value: string) {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleCreate() {
    if (!createForm.first_name.trim() && !createForm.last_name.trim()) {
      setCreateError("יש להזין שם");
      return;
    }
    const data = {
      first_name: createForm.first_name || null,
      last_name: createForm.last_name || null,
      phone: createForm.phone || null,
      city: createForm.city || null,
      street: createForm.street || null,
      birth_date: createForm.birth_date || null,
      id_number: createForm.id_number ? Number(createForm.id_number) : null,
      father_name: createForm.father_name || null,
      yeshiva: createForm.yeshiva || null,
      track: createForm.track || null,
      enrollment_date: createForm.enrollment_date || null,
      coordinator_id: createForm.coordinator_id || null,
      nedarim_id: createForm.nedarim_id ? Number(createForm.nedarim_id) : null,
      group_id: createForm.group_id || null,
      notes: createForm.notes || null,
    };
    setCreating(false);
    setCreateError("");
    startTransition(async () => {
      await createStudentAction(data);
      router.refresh();
    });
  }

  const selectedCount = selected.size;

  return (
    <>
      <div className="flex justify-end gap-2 mb-3">
        <button
          onClick={() => { setCreateForm(emptyForm()); setCreateError(""); setCreating(true); }}
          className="flex items-center gap-1.5 text-sm px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d4f7f] transition-colors ml-auto"
        >
          <Plus size={15} />
          בחור חדש
        </button>
        <button
          onClick={() => setShowFieldSettings(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          title="הגדרות עמודות"
        >
          <Settings size={15} />
        </button>
        <button
          onClick={() => setExportFormat("excel")}
          className="flex items-center gap-1.5 text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
        >
          <FileSpreadsheet size={15} />
          הורדת Excel
        </button>
        <button
          onClick={() => setExportFormat("pdf")}
          className="flex items-center gap-1.5 text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
        >
          <FileText size={15} />
          הורדת PDF
        </button>
      </div>
      {selectedCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 mb-3 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#1e3a5f]">
            <Users size={15} />
            נבחרו {selectedCount} בחורים
          </span>
          <select
            value={bulkCoordinator}
            onChange={(e) => setBulkCoordinator(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">— ללא משפיע —</option>
            {visibleCoordinators.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={handleReassign}
            disabled={isPending}
            className="text-sm px-4 py-1.5 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d4f7f] transition-colors disabled:opacity-50"
          >
            {isPending ? "מעדכן..." : "שנה משפיע"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700 mr-auto"
          >
            נקה בחירה
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-4 w-10">
                <input
                  type="checkbox"
                  aria-label="בחר הכל"
                  checked={visibleStudents.length > 0 && selectedCount === visibleStudents.length}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                />
              </th>
              {orderedFields.map((field) => (
                settings.visibleStudentFields.includes(field.id) && (
                  <th key={field.id} className="text-right px-6 py-4 font-semibold text-gray-600">
                    {field.label}
                  </th>
                )
              ))}
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleStudents.length > 0 ? (
              visibleStudents.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                  onClick={() => openEdit(student)}
                >
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`בחר את ${student.first_name} ${student.last_name}`}
                      checked={selected.has(student.id)}
                      onChange={() => toggleRow(student.id)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                  </td>
                  {orderedFields.map((field) => (
                    settings.visibleStudentFields.includes(field.id) && (
                      <td
                        key={field.id}
                        className={`px-6 py-4 ${
                          field.id === "name" ? "font-medium text-gray-900" : "text-gray-600"
                        } ${field.id === "score" ? "text-center" : ""}`}
                        onClick={(e) => {
                          if (field.id === "coordinator") e.stopPropagation();
                        }}
                      >
                        {field.id === "coordinator" ? (
                          student.coordinator_id ? (
                            <Link
                              href={`/coordinators/${student.coordinator_id}`}
                              className="text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {renderCellValue(field.id as FieldKey, student, visibleCoordinators, groups)}
                            </Link>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )
                        ) : field.id === "score" ? (
                          renderCellValue(field.id as FieldKey, student, visibleCoordinators, groups) !== "—" ? (
                            <span className="bg-blue-50 text-blue-700 font-semibold text-xs px-2.5 py-1 rounded-full">
                              {renderCellValue(field.id as FieldKey, student, visibleCoordinators, groups)}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )
                        ) : (
                          renderCellValue(field.id as FieldKey, student, visibleCoordinators, groups)
                        )}
                      </td>
                    )
                  ))}
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
              ))
            ) : (
              <tr>
                <td colSpan={settings.visibleStudentFields.length + 2} className="px-6 py-16 text-center text-gray-400">
                  אין בחורים להצגה
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FieldSettingsModal
        visible={showFieldSettings}
        onClose={() => setShowFieldSettings(false)}
        onToggleField={toggleStudentField}
        onReorderFields={setStudentFieldOrder}
        fields={fieldOptions}
      />

      {exportFormat && (
        <ExportDialog
          students={visibleStudents}
          format={exportFormat}
          onClose={() => setExportFormat(null)}
          visibleFields={settings.visibleStudentFields}
          fieldOrder={settings.studentFieldOrder}
        />
      )}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-[#1e3a5f]">בחור חדש</h2>
              <button
                onClick={() => setCreating(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-3">
              {CREATE_FIELDS.map(({ key, label, type }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">{label}</label>
                  <input
                    type={type ?? "text"}
                    value={createForm[key]}
                    onChange={(e) => setC(key, e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">משפיע</label>
                <select
                  value={createForm.coordinator_id}
                  onChange={(e) => setC("coordinator_id", e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">ללא משפיע</option>
                  {visibleCoordinators.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">קבוצה</label>
                <select
                  value={createForm.group_id}
                  onChange={(e) => setC("group_id", e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">ללא קבוצה</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-xs font-medium text-gray-500">הערות</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setC("notes", e.target.value)}
                  rows={2}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              {createError && <p className="text-red-500 text-xs col-span-2">{createError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setCreating(false)}
                disabled={isPending}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                ביטול
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending}
                className="flex items-center gap-2 bg-[#1e3a5f] text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-[#2d4f7f] disabled:opacity-50"
              >
                <Plus size={15} />
                {isPending ? "שומר..." : "הוסף בחור"}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <label className="text-xs font-medium text-gray-500">קבוצה</label>
              <select
                value={form.group_id}
                onChange={(e) => set("group_id", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">ללא קבוצה</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
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
                {visibleCoordinators.map((c) => (
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
