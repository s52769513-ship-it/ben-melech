"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FileSpreadsheet, FileText, Settings } from "lucide-react";
import EditModal from "@/components/EditModal";
import ExportDialog from "@/components/ExportDialog";
import FieldSettingsModal from "@/components/FieldSettingsModal";
import { updateStudent } from "@/app/students/actions";
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
  group_id: string | null;
  notes: string | null;
  coordinator?: { id: string; name: string } | null;
};

type ScoreStats = { total: number; count: number; attended: number; sessions: number };

interface Props {
  students: Student[];
  coordinators: CoordinatorOption[];
  groups: GroupOption[];
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

type FieldKey = typeof AVAILABLE_FIELDS[number]["id"];

function renderCellValue(fieldId: FieldKey, student: Student, scoreMap: Record<string, ScoreStats>, coordinators: CoordinatorOption[], groups: GroupOption[]): React.ReactNode {
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
    case "attendance": {
      const stats = scoreMap[student.id];
      return stats && stats.sessions > 0
        ? Math.round((stats.attended / stats.sessions) * 100) + "%"
        : "—";
    }
    case "score": {
      const stats = scoreMap[student.id];
      return stats && stats.count > 0
        ? (stats.total / stats.count).toFixed(1)
        : "—";
    }
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

export default function StudentsTable({ students, coordinators, groups, scoreMap }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [exportFormat, setExportFormat] = useState<"excel" | "pdf" | null>(null);
  const [showFieldSettings, setShowFieldSettings] = useState(false);
  const { settings, isStudentVisible, toggleStudentField, setStudentFieldOrder } = useSettings();
  const visibleStudents = students.filter(isStudentVisible);
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
        group_id: form.group_id || null,
        notes: form.notes || null,
      });
      closeEdit();
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex justify-end gap-2 mb-3">
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
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
                              {renderCellValue(field.id as FieldKey, student, scoreMap, visibleCoordinators, groups)}
                            </Link>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )
                        ) : field.id === "score" ? (
                          renderCellValue(field.id as FieldKey, student, scoreMap, visibleCoordinators, groups) !== "—" ? (
                            <span className="bg-blue-50 text-blue-700 font-semibold text-xs px-2.5 py-1 rounded-full">
                              {renderCellValue(field.id as FieldKey, student, scoreMap, visibleCoordinators, groups)}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )
                        ) : (
                          renderCellValue(field.id as FieldKey, student, scoreMap, visibleCoordinators, groups)
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
                <td colSpan={settings.visibleStudentFields.length + 1} className="px-6 py-16 text-center text-gray-400">
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
          scoreMap={scoreMap}
          format={exportFormat}
          onClose={() => setExportFormat(null)}
          visibleFields={settings.visibleStudentFields}
          fieldOrder={settings.studentFieldOrder}
        />
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
